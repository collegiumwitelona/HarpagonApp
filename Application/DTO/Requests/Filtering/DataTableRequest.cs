namespace Application.DTO.Requests.Filtering
{
    public class DataTableRequest
    {
        //public Guid? Id { get; set; }
        public int? Draw { get; set; } = 1;
        public int? Start { get; set; } = 0;
        public int? Length { get; set; } = null;
        public SearchRequest? Search { get; set; } = new SearchRequest();
        public List<SortingRequest>? Order { get; set; } = new List<SortingRequest>();
        public List<DataTableColumns>? Columns { get; set; } = new List<DataTableColumns>();
        public FilteringRequest? Filters { get; set; } = new FilteringRequest();
    }
}
