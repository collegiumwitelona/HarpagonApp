namespace Application.DTO.Requests.Filtering
{
    public class SortingRequest
    {
        public int Column { get; set; }
        public string? Dir { get; set; }  // "asc" or "desc"
    }
}
