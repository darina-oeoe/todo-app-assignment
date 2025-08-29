using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace todo.API.Migrations
{
    /// <inheritdoc />
    public partial class TrigramSearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Enable pg_trgm extension (needed for trigram indexes)
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

            // Create a trigram index on description column for fast ILIKE / %search% queries
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ix_todos_description_trgm
                ON todos
                USING GIN (description gin_trgm_ops);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop the index (safe to ignore if it doesn't exist)
            migrationBuilder.Sql("DROP INDEX IF EXISTS ix_todos_description_trgm;");
        }
    }
}

