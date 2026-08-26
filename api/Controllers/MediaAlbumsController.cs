using Ashour.Api.Contracts;
using Ashour.Api.Data;
using Ashour.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ashour.Api.Controllers;

[ApiController]
[Route("api/albums")]
public class MediaAlbumsController(AshourDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAlbums(CancellationToken cancellationToken)
    {
        var albums = await db.MediaAlbums
            .Where(a => a.IsActive)
            .OrderByDescending(a => a.EventDate ?? a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Description,
                a.CoverImageUrl,
                a.EventDate,
                a.CreatedAt,
                TotalItems = a.Items.Count,
                PhotoCount = a.Items.Count(i => i.MediaType == "Photo"),
                VideoCount = a.Items.Count(i => i.MediaType == "Video"),
                SampleThumbnails = a.Items.OrderByDescending(i => i.UploadedAt).Take(4).Select(i => i.FilePath).ToList()
            })
            .ToListAsync(cancellationToken);

        return Ok(albums);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetAlbum(int id, CancellationToken cancellationToken)
    {
        var album = await db.MediaAlbums
            .Include(a => a.Items)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);

        if (album is null) return NotFound(new { message = "الألبوم غير موجود" });

        return Ok(new
        {
            album.Id,
            album.Title,
            album.Description,
            album.CoverImageUrl,
            album.EventDate,
            album.CreatedAt,
            Items = album.Items.OrderByDescending(i => i.UploadedAt).Select(i => new
            {
                i.Id,
                i.AlbumId,
                i.FilePath,
                i.MediaType,
                i.Title,
                i.Caption,
                i.FileSize,
                i.UploadedAt
            })
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateAlbum([FromBody] CreateAlbumRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "عنوان الألبوم مطلوب" });

        var album = new MediaAlbum
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            CoverImageUrl = request.CoverImageUrl,
            EventDate = request.EventDate,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        db.MediaAlbums.Add(album);
        await db.SaveChangesAsync(cancellationToken);

        return Ok(album);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateAlbum(int id, [FromBody] UpdateAlbumRequest request, CancellationToken cancellationToken)
    {
        var album = await db.MediaAlbums.FindAsync([id], cancellationToken);
        if (album is null) return NotFound(new { message = "الألبوم غير موجود" });

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "عنوان الألبوم مطلوب" });

        album.Title = request.Title.Trim();
        album.Description = request.Description?.Trim();
        album.CoverImageUrl = request.CoverImageUrl;
        album.EventDate = request.EventDate;

        await db.SaveChangesAsync(cancellationToken);
        return Ok(album);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteAlbum(int id, CancellationToken cancellationToken)
    {
        var album = await db.MediaAlbums.Include(a => a.Items).FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
        if (album is null) return NotFound(new { message = "الألبوم غير موجود" });

        db.MediaAlbums.Remove(album);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "تم حذف الألبوم والوسائط التابعة له بنجاح" });
    }

    [HttpPost("{id:int}/media")]
    public async Task<IActionResult> AddMediaItems(int id, [FromBody] List<CreateMediaItemRequest> items, CancellationToken cancellationToken)
    {
        var album = await db.MediaAlbums.FindAsync([id], cancellationToken);
        if (album is null) return NotFound(new { message = "الألبوم غير موجود" });

        if (items == null || items.Count == 0)
            return BadRequest(new { message = "لا توجد وسائط للإضافة" });

        var newItems = items.Select(item => new MediaItem
        {
            AlbumId = id,
            FilePath = item.FilePath,
            MediaType = item.MediaType == "Video" ? "Video" : "Photo",
            Title = item.Title?.Trim(),
            Caption = item.Caption?.Trim(),
            FileSize = item.FileSize,
            UploadedAt = DateTime.UtcNow
        }).ToList();

        // If album doesn't have a cover image, set the first photo as cover
        if (string.IsNullOrWhiteSpace(album.CoverImageUrl))
        {
            var firstPhoto = newItems.FirstOrDefault(i => i.MediaType == "Photo");
            if (firstPhoto != null)
            {
                album.CoverImageUrl = firstPhoto.FilePath;
            }
        }

        db.MediaItems.AddRange(newItems);
        await db.SaveChangesAsync(cancellationToken);

        return Ok(newItems);
    }

    [HttpDelete("{id:int}/media/{mediaId:int}")]
    public async Task<IActionResult> DeleteMediaItem(int id, int mediaId, CancellationToken cancellationToken)
    {
        var media = await db.MediaItems.FirstOrDefaultAsync(m => m.Id == mediaId && m.AlbumId == id, cancellationToken);
        if (media is null) return NotFound(new { message = "ملف الوسائط غير موجود" });

        db.MediaItems.Remove(media);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "تم حذف الملف بنجاح" });
    }
}
