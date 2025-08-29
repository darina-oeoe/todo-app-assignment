using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace todo.API.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "todos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: false),
                    Done = table.Column<bool>(type: "boolean", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_todos", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_todos_CreatedAt_Id",
                table: "todos",
                columns: new[] { "CreatedAt", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_todos_Done",
                table: "todos",
                column: "Done");

            migrationBuilder.CreateIndex(
                name: "IX_todos_DueDate",
                table: "todos",
                column: "DueDate");

            migrationBuilder.CreateIndex(
                name: "IX_todos_ParentId",
                table: "todos",
                column: "ParentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "todos");
        }
    }
}
