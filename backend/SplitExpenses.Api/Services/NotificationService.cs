#region

using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using SplitExpenses.Api.Models;
using SplitExpenses.Api.Repositories;

#endregion

namespace SplitExpenses.Api.Services;

public class NotificationService : INotificationService
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly IListRepository _listRepository;
    private readonly FirebaseMessaging? _messaging;
    private readonly IReimbursementRepository _reimbursementRepository;
    private readonly IUserRepository _userRepository;

    public NotificationService(
        IConfiguration configuration,
        IExpenseRepository expenseRepository,
        IListRepository listRepository,
        IReimbursementRepository reimbursementRepository,
        IUserRepository userRepository)
    {
        _expenseRepository = expenseRepository;
        _listRepository = listRepository;
        _reimbursementRepository = reimbursementRepository;
        _userRepository = userRepository;

        var credentialsPath = configuration["Firebase:CredentialsPath"];
        if (!string.IsNullOrEmpty(credentialsPath) && File.Exists(credentialsPath))
        {
            var app = FirebaseApp.DefaultInstance ?? FirebaseApp.Create(new AppOptions
            {
                Credential = GoogleCredential.FromFile(credentialsPath)
            });
            _messaging = FirebaseMessaging.GetMessaging(app);
        }
        else
        {
            _messaging = null;
        }
    }

    public async Task SendNewExpenseNotificationAsync(Guid expenseId)
    {
        if (_messaging is null) return;
        var expense = await _expenseRepository.GetByIdAsync(expenseId);
        if (expense == null) return;

        var list = await _listRepository.GetByIdAsync(expense.ListId);
        var members = await _listRepository.GetListMembersAsync(expense.ListId);
        var recipients = members
            .Where(m => m.Status == MemberStatus.Active && m.UserId.HasValue && m.UserId != expense.AuthorId)
            .Select(m => m.UserId!.Value)
            .Append(list?.AdminId ?? Guid.Empty)
            .Where(id => id != Guid.Empty)
            .Distinct();

        foreach (var userId in recipients)
            await SendMessageAsync(
                userId,
                prefs => prefs.NewExpense,
                "Nuova spesa",
                $"\"{expense.Title}\" è stata aggiunta in {list?.Name ?? "una lista"}",
                new Dictionary<string, string>
                {
                    { "type", "new_expense" },
                    { "expense_id", expenseId.ToString() },
                    { "list_id", expense.ListId.ToString() }
                });
    }

    public async Task SendMemberAddedNotificationAsync(Guid listId, Guid memberId)
    {
        if (_messaging is null) return;
        var list = await _listRepository.GetByIdAsync(listId);
        var member = await _listRepository.GetMemberAsync(memberId);
        if (list == null || member == null) return;

        var members = await _listRepository.GetListMembersAsync(listId);
        var recipients = members
            .Where(m => m.Status == MemberStatus.Active && m.UserId.HasValue)
            .Select(m => m.UserId!.Value)
            .Append(list.AdminId)
            .Distinct()
            .Where(id => !member.UserId.HasValue || id != member.UserId.Value);

        foreach (var userId in recipients)
            await SendMessageAsync(
                userId,
                prefs => prefs.MemberAdded,
                "Nuovo membro nella lista",
                $"{member.DisplayName ?? member.Email} si è aggiunto/a a {list.Name}",
                new Dictionary<string, string>
                {
                    { "type", "member_added" },
                    { "list_id", listId.ToString() },
                    { "member_id", memberId.ToString() }
                });
    }

    public async Task SendValidationRequestNotificationAsync(Guid expenseId, Guid validatorId)
    {
        if (_messaging is null) return;
        var expense = await _expenseRepository.GetByIdAsync(expenseId);
        if (expense == null) return;

        await SendMessageAsync(
            validatorId,
            prefs => prefs.ValidationRequest,
            "Richiesta di validazione",
            $"La spesa '{expense.Title}' è pronta per essere validata",
            new Dictionary<string, string>
            {
                { "type", "validation_request" },
                { "expense_id", expenseId.ToString() }
            });
    }

    public async Task SendValidationResultNotificationAsync(Guid expenseId, bool approved)
    {
        if (_messaging is null) return;
        var expense = await _expenseRepository.GetByIdAsync(expenseId);
        if (expense == null) return;

        await SendMessageAsync(
            expense.AuthorId,
            prefs => prefs.ValidationResult,
            approved ? "Spesa approvata" : "Spesa rifiutata",
            $"La tua spesa '{expense.Title}' è stata {(approved ? "approvata" : "rifiutata")}",
            new Dictionary<string, string>
            {
                { "type", "validation_result" },
                { "expense_id", expenseId.ToString() },
                { "approved", approved.ToString() }
            });
    }

    public async Task SendNewReimbursementNotificationAsync(Guid reimbursementId)
    {
        if (_messaging is null) return;
        var reimbursement = await _reimbursementRepository.GetByIdAsync(reimbursementId);
        if (reimbursement == null) return;

        var payload = new Dictionary<string, string>
        {
            { "type", "new_reimbursement" },
            { "reimbursement_id", reimbursementId.ToString() },
            { "list_id", reimbursement.ListId.ToString() }
        };

        await SendMessageAsync(
            reimbursement.FromUserId,
            prefs => prefs.NewReimbursement,
            "Devi effettuare un rimborso",
            $"Paga {reimbursement.Amount:C} a chi ti ha anticipato",
            payload);

        await SendMessageAsync(
            reimbursement.ToUserId,
            prefs => prefs.NewReimbursement,
            "Stai per ricevere un rimborso",
            $"{reimbursement.Amount:C} ti verranno restituiti",
            payload);
    }

    private async Task SendMessageAsync(
        Guid userId,
        Func<NotificationPreferences, bool> preferenceSelector,
        string title,
        string body,
        IReadOnlyDictionary<string, string> data)
    {
        if (_messaging is null || userId == Guid.Empty) return;
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null) return;
        if (!preferenceSelector(user.NotificationPreferences)) return;

        var deviceTokens = await _userRepository.GetDeviceTokensAsync(userId);
        foreach (var token in deviceTokens)
        {
            var message = new Message
            {
                Token = token,
                Notification = new Notification
                {
                    Title = title,
                    Body = body
                },
                Data = new Dictionary<string, string>(data)
            };

            try
            {
                await _messaging.SendAsync(message);
            }
            catch
            {
                // Ignora errori di invio per singolo device
            }
        }
    }
}