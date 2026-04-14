namespace Application.DTO.Requests.Filtering
{
    public class DataTableColumns
    {
        public string? data { get; set; }
        public string? name { get; set; }
        public bool searchable { get; set; }
        public bool orderable { get; set; }
    }
}
