using System.ComponentModel.DataAnnotations;

namespace Application.DTO.Requests
{
    public class DashboardRequest
    {
        [Required]
        public required DateOnly FromDate { get; set; }
        [Required]
        public required DateOnly ToDate { get; set; }
    }
}
