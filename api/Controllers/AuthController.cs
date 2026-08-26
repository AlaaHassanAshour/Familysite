using Ashour.Api.Contracts;
using Ashour.Api.Data;
using Ashour.Api.Models;
using Ashour.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Ashour.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AshourDbContext db) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "اسم المستخدم وكلمة المرور مطلوبة" });

        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username.Trim(), cancellationToken);
        if (user is null || !user.IsActive)
            return Unauthorized(new { message = "اسم المستخدم أو كلمة المرور غير صحيحة، أو الحساب معطل" });

        var isValid = SecurityHelper.VerifyPassword(request.Password, user.PasswordHash, user.PasswordSalt);
        if (!isValid)
            return Unauthorized(new { message = "اسم المستخدم أو كلمة المرور غير صحيحة" });

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        // Simple token for demonstration/SPA auth header
        var token = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($"{user.Id}:{user.Username}:{user.Role}:{DateTime.UtcNow.Ticks}"));

        return Ok(new
        {
            token,
            user = new
            {
                user.Id,
                user.Username,
                user.FullName,
                user.Email,
                user.Role
            }
        });
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
    {
        var users = await db.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.FullName,
                u.Email,
                u.Role,
                u.IsActive,
                u.CreatedAt,
                u.LastLoginAt
            })
            .ToListAsync(cancellationToken);

        return Ok(users);
    }

    [HttpPost("users")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "اسم المستخدم وكلمة المرور حقول مطلوبة" });

        if (await db.Users.AnyAsync(u => u.Username == request.Username.Trim(), cancellationToken))
            return BadRequest(new { message = "اسم المستخدم مسجل مسبقاً" });

        var (hash, salt) = SecurityHelper.HashPassword(request.Password);
        var user = new User
        {
            Username = request.Username.Trim(),
            PasswordHash = hash,
            PasswordSalt = salt,
            FullName = request.FullName.Trim(),
            Email = request.Email?.Trim(),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Admin" : request.Role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            user.Id,
            user.Username,
            user.FullName,
            user.Email,
            user.Role,
            user.IsActive,
            user.CreatedAt
        });
    }

    [HttpPut("users/{id:int}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FindAsync([id], cancellationToken);
        if (user is null) return NotFound(new { message = "المستخدم غير موجود" });

        user.FullName = request.FullName.Trim();
        user.Email = request.Email?.Trim();
        user.Role = request.Role;
        user.IsActive = request.IsActive;

        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "تم تحديث بيانات المستخدم بنجاح" });
    }

    [HttpPut("users/{id:int}/password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            return BadRequest(new { message = "يجب ألا تقل كلمة المرور عن ٦ خانات" });

        var user = await db.Users.FindAsync([id], cancellationToken);
        if (user is null) return NotFound(new { message = "المستخدم غير موجود" });

        var (hash, salt) = SecurityHelper.HashPassword(request.NewPassword);
        user.PasswordHash = hash;
        user.PasswordSalt = salt;

        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "تم تغيير كلمة المرور بنجاح" });
    }

    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id, CancellationToken cancellationToken)
    {
        var user = await db.Users.FindAsync([id], cancellationToken);
        if (user is null) return NotFound(new { message = "المستخدم غير موجود" });

        // Don't delete last admin
        var adminCount = await db.Users.CountAsync(u => u.Role == "Admin" && u.IsActive, cancellationToken);
        if (user.Role == "Admin" && adminCount <= 1)
            return BadRequest(new { message = "لا يمكن حذف المشرف الأساسي الوحيد للنظام" });

        db.Users.Remove(user);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "تم حذف المستخدم بنجاح" });
    }
}
