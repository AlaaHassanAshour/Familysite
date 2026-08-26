using Ashour.Api.Contracts;
using Ashour.Api.Data;
using Ashour.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ashour.Api.Controllers;

[ApiController]
[Route("api/upcoming-events")]
public class UpcomingEventsController(AshourDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUpcomingEvents([FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var query = db.UpcomingEvents.AsNoTracking();
        if (activeOnly)
        {
            query = query.Where(e => e.IsActive);
        }

        var events = await query
            .OrderBy(e => e.EventDate)
            .Select(e => new
            {
                e.Id,
                e.Title,
                e.Description,
                e.EventDate,
                e.Location,
                e.EventType,
                e.ContactPerson,
                e.IsActive,
                e.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(events);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetEvent(int id, CancellationToken cancellationToken)
    {
        var item = await db.UpcomingEvents.FindAsync([id], cancellationToken);
        if (item is null) return NotFound(new { message = "المناسبة غير موجودة" });
        return Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] CreateUpcomingEventRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "عنوان المناسبة مطلوب" });

        var item = new UpcomingEvent
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            EventDate = request.EventDate,
            Location = request.Location?.Trim(),
            EventType = string.IsNullOrWhiteSpace(request.EventType) ? "مناسبة عامة" : request.EventType,
            ContactPerson = request.ContactPerson?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        db.UpcomingEvents.Add(item);
        await db.SaveChangesAsync(cancellationToken);

        return Ok(item);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateEvent(int id, [FromBody] UpdateUpcomingEventRequest request, CancellationToken cancellationToken)
    {
        var item = await db.UpcomingEvents.FindAsync([id], cancellationToken);
        if (item is null) return NotFound(new { message = "المناسبة غير موجودة" });

        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "عنوان المناسبة مطلوب" });

        item.Title = request.Title.Trim();
        item.Description = request.Description?.Trim();
        item.EventDate = request.EventDate;
        item.Location = request.Location?.Trim();
        item.EventType = request.EventType;
        item.ContactPerson = request.ContactPerson?.Trim();

        await db.SaveChangesAsync(cancellationToken);
        return Ok(item);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteEvent(int id, CancellationToken cancellationToken)
    {
        var item = await db.UpcomingEvents.FindAsync([id], cancellationToken);
        if (item is null) return NotFound(new { message = "المناسبة غير موجودة" });

        db.UpcomingEvents.Remove(item);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "تم حذف المناسبة بنجاح" });
    }
}
