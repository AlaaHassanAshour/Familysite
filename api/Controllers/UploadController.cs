using Ashour.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Ashour.Api.Controllers;

[ApiController]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    private readonly IUplodeFile _fileServices;
    private static readonly HashSet<string> AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private static readonly HashSet<string> AllowedVideoExtensions = [".mp4", ".mov", ".webm", ".mkv"];
    private static readonly HashSet<string> AllowedDocExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx"];
    public UploadController(IUplodeFile fileServices)
    {
        _fileServices = fileServices;
    }

    [HttpPost("single")]
    public async Task<IActionResult> UploadSingle([FromForm] IFormFile? file, [FromQuery] string folder = "general", CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "لم يتم اختيار أي ملف للرفع" });

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var isImage = AllowedImageExtensions.Contains(ext);
        var isVideo = AllowedVideoExtensions.Contains(ext);
        var isDoc = AllowedDocExtensions.Contains(ext);

        if (!isImage && !isVideo && !isDoc)
            return BadRequest(new { message = "نوع الملف غير مدعوم" });

        // Target path
        var safeFolder = string.Join("_", folder.Split(Path.GetInvalidFileNameChars())).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(safeFolder)) safeFolder = "general";

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "uploads", safeFolder);
        Directory.CreateDirectory(uploadsRoot);

        var safeOriginalName = Path.GetFileNameWithoutExtension(file.FileName);
        if (safeOriginalName.Length > 30) safeOriginalName = safeOriginalName[..30];
        safeOriginalName = string.Join("_", safeOriginalName.Split(Path.GetInvalidFileNameChars()));

        var uniqueFileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid().ToString()[..6]}_{safeOriginalName}{ext}";
        var physicalPath = Path.Combine(uploadsRoot, uniqueFileName);

        using (var stream = new FileStream(physicalPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }

        var relativeUrl = $"/uploads/{safeFolder}/{uniqueFileName}";

        return Ok(new
        {
            url = relativeUrl,
            fileName = file.FileName,
            fileSize = file.Length,
            mediaType = isVideo ? "Video" : (isImage ? "Photo" : "Document")
        });
    }

    [HttpPost("multiple")]
    public async Task<IActionResult> UploadMultiple([FromForm] List<IFormFile> files, [FromQuery] string folder = "albums", CancellationToken cancellationToken = default)
    {
        if (files == null || files.Count == 0)
            return BadRequest(new { message = "لم يتم اختيار أي ملفات للرفع" });
        //var file = await _fileServices.UploadImageAsync(model.file);

        var safeFolder = string.Join("_", folder.Split(Path.GetInvalidFileNameChars())).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(safeFolder)) safeFolder = "albums";

        var uploadsRoot = Path.Combine(Directory.GetCurrentDirectory(), "uploads", safeFolder);
        Directory.CreateDirectory(uploadsRoot);

        var results = new List<object>();

        foreach (var file in files)
        {
            if (file.Length == 0) continue;

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var isImage = AllowedImageExtensions.Contains(ext);
            var isVideo = AllowedVideoExtensions.Contains(ext);

            if (!isImage && !isVideo) continue;

            var safeOriginalName = Path.GetFileNameWithoutExtension(file.FileName);
            if (safeOriginalName.Length > 20) safeOriginalName = safeOriginalName[..20];
            safeOriginalName = string.Join("_", safeOriginalName.Split(Path.GetInvalidFileNameChars()));

            var uniqueFileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid().ToString()[..6]}_{safeOriginalName}{ext}";
            var physicalPath = Path.Combine(uploadsRoot, uniqueFileName);

            using (var stream = new FileStream(physicalPath, FileMode.Create))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var relativeUrl = $"/uploads/{safeFolder}/{uniqueFileName}";

            results.Add(new
        {
            url = relativeUrl,
            fileName = file.FileName,
            fileSize = file.Length,
            mediaType = isVideo ? "Video" : "Photo"
        });
    }

        return Ok(results);
}
}
