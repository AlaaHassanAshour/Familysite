using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ashour.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "BirthDate",
                table: "CouncilMembers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NationalId",
                table: "CouncilMembers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "CouncilMembers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BirthDate",
                table: "CouncilMembers");

            migrationBuilder.DropColumn(
                name: "NationalId",
                table: "CouncilMembers");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "CouncilMembers");
        }
    }
}
