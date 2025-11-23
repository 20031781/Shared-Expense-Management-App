namespace SplitExpenses.Api.Services;

public class LocalReceiptStorage(IWebHostEnvironment environment) : IReceiptStorage
{
    private const string FolderName = "receipts";

    public async Task<string> SaveAsync(Guid expenseId, IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file.Length == 0) throw new InvalidOperationException("Receipt file is empty");

        var root = environment.WebRootPath;
        if (string.IsNullOrWhiteSpace(root)) root = Path.Combine(environment.ContentRootPath, "wwwroot");

        var targetDirectory = Path.Combine(root, FolderName);
        Directory.CreateDirectory(targetDirectory);

        var extension = Path.GetExtension(file.FileName);
        var safeExtension = string.IsNullOrWhiteSpace(extension) ? ".jpg" : extension;
        var filename = $"{expenseId:N}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{safeExtension}";
        var destination = Path.Combine(targetDirectory, filename);

        await using var stream = new FileStream(destination, FileMode.Create, FileAccess.Write);
        await file.CopyToAsync(stream, cancellationToken);

        return $"/{FolderName}/{filename}";
    }
}