using System.Security.Claims;

namespace Application.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        public static Guid GetUserId(this ClaimsPrincipal user)
        {
            var claim = user.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null)
                throw new UnauthorizedAccessException("UserId claim not found");

            return Guid.Parse(claim.Value);
        }

        public static string GetRole(this ClaimsPrincipal user)
        {
            return user.FindFirst("role")?.Value ?? string.Empty;
        }

        public static bool IsInRole(this ClaimsPrincipal user, string role)
        {
            return string.Equals(user.GetRole(), role, StringComparison.OrdinalIgnoreCase);
        }
    }
}
