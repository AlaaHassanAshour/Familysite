using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Ashour.Api.Data;

public class AshourDbContextFactory : IDesignTimeDbContextFactory<AshourDbContext>
{
    public AshourDbContext CreateDbContext(string[] args)
    {
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("AshourDatabase")
            ?? throw new InvalidOperationException("ConnectionStrings:AshourDatabase is missing.");
        var options = new DbContextOptionsBuilder<AshourDbContext>();
        options.UseSqlServer(connectionString);
        return new AshourDbContext(options.Options);
    }
}
