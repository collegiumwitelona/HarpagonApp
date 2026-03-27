using Application.DTO.Responses;

namespace Application.Interfaces.Core
{
    public interface IDashboardService
    {
        public Task<DashboardResponse> GetDashboard(Guid userId, DateOnly fromDate, DateOnly toDate);
    }
}
