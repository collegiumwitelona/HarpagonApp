namespace Application.DTO.Requests.Filtering
{
    public class DataTableColumns
    {
        public string? Data { get; set; }
        public string? Name { get; set; }
        public bool Searchable { get; set; }
        public bool Orderable { get; set; }
    }
}
