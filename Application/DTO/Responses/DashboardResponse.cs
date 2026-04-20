namespace Application.DTO.Responses
{
    public class DashboardResponse
    {
        public string Name { get; set; }
        public int TransactionsCount { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal TotalIncomes { get; set; }
        public decimal CurrentTotalBalance {  get; set; }
        public DateTime LastUpdated { get; set; }

        public Dictionary<string, decimal> ExpensesByCategory { get; set; }
        public Dictionary<string, decimal> IncomesByCategory { get; set; }
    }
}
