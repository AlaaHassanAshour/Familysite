using System.Security.Cryptography;
using System.Text;

namespace Ashour.Api.Services;

public static class SecurityHelper
{
    public static (string Hash, string Salt) HashPassword(string password)
    {
        var saltBytes = RandomNumberGenerator.GetBytes(16);
        var salt = Convert.ToBase64String(saltBytes);
        var hash = ComputeHash(password, salt);
        return (hash, salt);
    }

    public static bool VerifyPassword(string password, string hash, string salt)
    {
        var computed = ComputeHash(password, salt);
        return computed == hash;
    }

    private static string ComputeHash(string password, string salt)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(salt));
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hashBytes);
    }
}
