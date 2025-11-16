#region

using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using SplitExpenses.Api.Repositories;

#endregion

namespace SplitExpenses.Api.Services;

public class NotificationService : INotificationService
{
    private readonly IExpenseRepository _expenseRepository;
    private readonly FirebaseMessaging _messaging;
    private readonly IReimbursementRepository _reimbursementRepository;
    private readonly IUserRepository _userRepository;

    public NotificationService(
        IConfiguration configuration,
        IExpenseRepository expenseRepository,
        IReimbursementRepository reimbursementRepository,
        IUserRepository userRepository)
    {
        _expenseRepository = expenseRepository;
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
            _messaging = null!;
        }
    }

    public async Task SendNewExpenseNotificationAsync(Guid expenseId)
    {
        var expense = await _expenseRepository.GetByIdAsync(expenseId);
        if (expense == null) return;

        // TODO: Recupera membri della lista e invia notifiche
        // Implementazione completa richiede query ai membri
    }

    public async Task SendValidationRequestNotificationAsync(Guid expenseId, Guid validatorId)
    {
        var expense = await _expenseRepository.GetByIdAsync(expenseId);
        if (expense == null) return;

        var deviceTokens = await _userRepository.GetDeviceTokensAsync(validatorId);

        foreach (var token in deviceTokens)
        {
            var message = new Message
            {
                Token = token,
                Notification = new Notification
                {
                    Title = "Richiesta Validazione",
                    Body = $"Nuova spesa da validare: {expense.Title}"
                },
                Data = new Dictionary<string, string>
                {
                    { "type", "validation_request" },
                    { "expense_id", expenseId.ToString() }
                }
            };

            try
            {
                await _messaging.SendAsync(message);
            }
            catch
            {
                // Log errore invio notifica
            }
        }
    }

    public async Task SendValidationResultNotificationAsync(Guid expenseId, bool approved)
    {
        var expense = await _expenseRepository.GetByIdAsync(expenseId);
        if (expense == null) return;

        var deviceTokens = await _userRepository.GetDeviceTokensAsync(expense.AuthorId);

        foreach (var token in deviceTokens)
        {
            var message = new Message
            {
                Token = token,
                Notification = new Notification
                {
                    Title = approved ? "Spesa Approvata" : "Spesa Rifiutata",
                    Body = $"La tua spesa '{expense.Title}' è stata {(approved ? "approvata" : "rifiutata")}"
                },
                Data = new Dictionary<string, string>
                {
                    { "type", "validation_result" },
                    { "expense_id", expenseId.ToString() },
                    { "approved", approved.ToString() }
                }
            };

            try
            {
                await _messaging.SendAsync(message);
            }
            catch
            {
                // Log errore invio notifica
            }
        }
    }

    public async Task SendNewReimbursementNotificationAsync(Guid reimbursementId)
    {
        var reimbursement = await _reimbursementRepository.GetByIdAsync(reimbursementId);
        if (reimbursement == null) return;

        // Notifica a chi deve pagare
        await _userRepository.GetDeviceTokensAsync(reimbursement.FromUserId);
        // Notifica a chi deve ricevere
        await _userRepository.GetDeviceTokensAsync(reimbursement.ToUserId);

        // TODO: Invia notifiche a entrambe le parti
    }
}