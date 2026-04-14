namespace Application.DTO.Requests.Filtering
{
    public class FilteringRequest
    {
        public string? CategoryName { get; set; } = null;
        public DateOnly? FromDate { get; set; } = null;
        public DateOnly? ToDate { get; set; } = null;
        public decimal? FromAmount { get; set; } = null;
        public decimal? ToAmount { get; set; } = null;
    }
}
