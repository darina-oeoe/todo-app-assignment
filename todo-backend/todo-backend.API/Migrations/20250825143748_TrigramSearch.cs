using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace todo.API.Migrations
{
    public partial class TrigramSearch : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ix_todos_description_trgm
                ON ""todos""
                USING GIN (""Description"" gin_trgm_ops);
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ix_todos_description_trgm;");
        }
    }
}

