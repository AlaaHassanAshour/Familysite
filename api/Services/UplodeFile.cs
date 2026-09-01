namespace Ashour.Api.Services
{
    public class UplodeFile: IUplodeFile
    {
        private readonly IWebHostEnvironment _env;

        public UplodeFile(IWebHostEnvironment env)
        {
            _env = env;
        }
        public async Task<string> UploadImageAsync(IFormFile file)
        {
            if (file == null)
            {
                return null;
            }
            var uploadFolder = Path.Combine(_env.WebRootPath, "File");
          
                string fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                string filePath = Path.Combine(uploadFolder, fileName);
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }
                //await ResizeImage(filePath, uploadFolder, fileName);
                return fileName;

           }

    }
}
