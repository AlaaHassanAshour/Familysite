using Ashour.Api.Contracts;
using Ashour.Api.Data;
using Ashour.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ashour.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SliderController(AshourDbContext db) : ControllerBase
    {
        [HttpGet("{id}")]
        public async Task<IActionResult> GetSliderById(int id)
        {
            var slider = db.SliderImages.Find(id);
            if (slider == null) return NotFound();
            return Ok(slider);
        }
        // sliders
        [HttpGet("sliders")]
        public async Task<IActionResult> Sliders([FromQuery] int? limit, CancellationToken cancellationToken = default)
        {
            var query = db.SliderImages
                .OrderByDescending(x => x.Id)
                .AsQueryable();

            if (limit.HasValue && limit.Value > 0)
                query = query.Take(limit.Value);

            var result = await query.Select(x => new
            {
                x.Id,
                x.Title,
                x.Subtitle,
                x.ButtonText,
                x.Badge,
                x.ButtonUrl,
                x.IsActive,
                x.DisplayOrder,
                x.ImageUrl,
            }).ToListAsync(cancellationToken);

            return Ok(result);
        }

        [HttpPost("sliders")]
        public async Task<IActionResult> AddSlider([FromBody] CreateSliderRequest request, CancellationToken cancellationToken)
        {
            var slider = new SliderImage
            {
                Title = request.Title,
                Badge=request.Badge,
                Subtitle=request.Subtitle,
                ButtonText=request.ButtonText,
                ButtonUrl=request.ButtonUrl,
                DisplayOrder = request.DisplayOrder,
                ImageUrl = request.ImageUrl,
                IsActive=request.isActive,
                CreatedAt = DateTime.UtcNow
            };

            db.SliderImages.Add(slider);
            await db.SaveChangesAsync(cancellationToken);
            return CreatedAtAction(nameof(slider), new { id = slider.Id }, slider);
        }

        [HttpPut("sliders/{id:int}")]
        public async Task<IActionResult> UpdateSlider(int id, [FromBody] UpdateSliderRequest request, CancellationToken cancellationToken)
        {
            var slider = await db.SliderImages.FindAsync([id], cancellationToken);
            if (slider is null) return NotFound(new { message = "النشاط غير موجود" });

            slider.Title = request.Title;
            slider.Subtitle = request.Subtitle;
            slider.Badge = request.Badge;
            slider.ButtonUrl = request.ButtonUrl;
            slider.ButtonText = request.ButtonText;
            
            slider.DisplayOrder = request.DisplayOrder;
            slider.IsActive = request.isActive;

            slider.ImageUrl = request.ImageUrl;

            await db.SaveChangesAsync(cancellationToken);
            return NoContent();
        }

        [HttpDelete("sliders/{id:int}")]
        public async Task<IActionResult> DeleteSlider(int id, CancellationToken cancellationToken)
        {
            var slider = await db.SliderImages.FindAsync([id], cancellationToken);
            if (slider is null) return NotFound(new { message = "النشاط غير موجود" });

            db.SliderImages.Remove(slider);
            await db.SaveChangesAsync(cancellationToken);
            return NoContent();
        }
    }
}
