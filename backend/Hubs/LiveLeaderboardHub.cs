using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace Gamesphere.Hubs
{
    public class LiveLeaderboardHub : Hub
    {
        public async Task SendUpdate(object payload)
        {
            await Clients.All.SendAsync("LeaderboardUpdated", payload);
        }
    }
}
