namespace Application.Interfaces
{
    public interface IFrontendLinkBuilder
    {
        string BuildFrontendLink(string action, Guid userId, string token);
    }
}
