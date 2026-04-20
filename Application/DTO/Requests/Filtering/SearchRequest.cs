namespace Application.DTO.Requests.Filtering
{
    public class SearchRequest
    {
        public string? Value { get; set; }
        public bool Regex { get; set; }
    }
}
