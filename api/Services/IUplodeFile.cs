namespace Ashour.Api.Services
{
    public interface IUplodeFile
    {
        Task<string> UploadImageAsync(IFormFile file);

    }
}
