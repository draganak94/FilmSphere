using System.Text.Json;
using FilmSphere.Core.Entities;
using FilmSphere.Infrastructure.Data;

namespace FilmSphere.Infrastructure.Services;

public class FilmSeeder(AppDbContext db)
{
    private const string Token = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI2YzE0YmJjMmExY2FhNTMwNmJlZTJiYWQxYjJhNGE1MyIsIm5iZiI6MTc3OTUyOTgxOC43MzMsInN1YiI6IjZhMTE3ODVhYzMzODAwN2Q0YmZjZDVmOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.bLMQDZfDwO1cdgBn8m5PHr2zprKFnUFupllA0oOwKYw";
    private const string BaseUrl = "https://api.themoviedb.org/3";
    private const string PosterBase = "https://image.tmdb.org/t/p/w500";

    public async Task SeedAsync()
    {
        if (db.Films.Any()) return;

        using var http = new HttpClient();
        http.DefaultRequestHeaders.Add("Authorization", $"Bearer {Token}");

        var ids = await GetPopularMovieIdsAsync(http, pages: 5);
        Console.WriteLine($"Pronađeno {ids.Count} filmova, importujem...");

        int inserted = 0;
        foreach (var id in ids)
        {
            var film = await FetchFilmAsync(http, id);
            if (film is null) continue;

            db.Films.Add(film);
            await db.SaveChangesAsync();
            inserted++;
            Console.WriteLine($"[{inserted}/{ids.Count}] {film.Title} ({film.Year})");
        }

        Console.WriteLine($"Završeno! Insertovano {inserted} filmova.");
    }

    private static async Task<List<int>> GetPopularMovieIdsAsync(HttpClient http, int pages)
    {
        var ids = new List<int>();
        for (int page = 1; page <= pages; page++)
        {
            var json = await http.GetStringAsync($"{BaseUrl}/movie/popular?page={page}");
            var doc = JsonDocument.Parse(json);
            foreach (var item in doc.RootElement.GetProperty("results").EnumerateArray())
                ids.Add(item.GetProperty("id").GetInt32());
        }
        return ids;
    }

    private static async Task<Film?> FetchFilmAsync(HttpClient http, int movieId)
    {
        try
        {
            var detailsJson = await http.GetStringAsync($"{BaseUrl}/movie/{movieId}");
            var creditsJson = await http.GetStringAsync($"{BaseUrl}/movie/{movieId}/credits");
            var videosJson  = await http.GetStringAsync($"{BaseUrl}/movie/{movieId}/videos");

            var details = JsonDocument.Parse(detailsJson).RootElement;
            var credits = JsonDocument.Parse(creditsJson).RootElement;
            var videos  = JsonDocument.Parse(videosJson).RootElement;

            var releaseDate = details.GetProperty("release_date").GetString();
            if (string.IsNullOrEmpty(releaseDate)) return null;

            var director = credits.GetProperty("crew").EnumerateArray()
                .FirstOrDefault(c => c.GetProperty("job").GetString() == "Director")
                .GetProperty("name").GetString() ?? "Unknown";

            var cast = string.Join(", ", credits.GetProperty("cast").EnumerateArray()
                .Take(5)
                .Select(c => c.GetProperty("name").GetString()));

            string? trailerUrl = null;
            foreach (var v in videos.GetProperty("results").EnumerateArray())
            {
                if (v.GetProperty("site").GetString() == "YouTube" &&
                    v.GetProperty("type").GetString() == "Trailer")
                {
                    trailerUrl = $"https://www.youtube.com/watch?v={v.GetProperty("key").GetString()}";
                    break;
                }
            }

            var genres = string.Join(", ", details.GetProperty("genres").EnumerateArray()
                .Select(g => g.GetProperty("name").GetString()));

            var posterPath = details.TryGetProperty("poster_path", out var pp) ? pp.GetString() : null;
            var runtime = details.TryGetProperty("runtime", out var rt) && rt.ValueKind == JsonValueKind.Number
                ? rt.GetInt32() : (int?)null;

            return new Film
            {
                Title = details.GetProperty("title").GetString()!,
                Year = int.Parse(releaseDate[..4]),
                Director = director,
                Description = details.GetProperty("overview").GetString(),
                Genre = genres,
                DurationMinutes = runtime,
                Cast = cast,
                PosterUrl = posterPath != null ? $"{PosterBase}{posterPath}" : null,
                TrailerUrl = trailerUrl,
                AverageRating = 0,
                CreatedAt = DateTime.UtcNow
            };
        }
        catch
        {
            return null;
        }
    }
}
