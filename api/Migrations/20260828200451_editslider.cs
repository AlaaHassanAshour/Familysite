using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ashour.Api.Migrations
{
    /// <inheritdoc />
    public partial class editslider : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Caption",
                table: "SliderImages",
                newName: "Subtitle");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "SliderImages",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "Badge",
                table: "SliderImages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ButtonText",
                table: "SliderImages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ButtonUrl",
                table: "SliderImages",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "SliderImages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Badge",
                table: "SliderImages");

            migrationBuilder.DropColumn(
                name: "ButtonText",
                table: "SliderImages");

            migrationBuilder.DropColumn(
                name: "ButtonUrl",
                table: "SliderImages");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "SliderImages");

            migrationBuilder.RenameColumn(
                name: "Subtitle",
                table: "SliderImages",
                newName: "Caption");

            migrationBuilder.AlterColumn<string>(
                name: "ImageUrl",
                table: "SliderImages",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
