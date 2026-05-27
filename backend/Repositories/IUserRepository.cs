using Gamesphere.Models;
using System.Collections.Generic;

namespace Gamesphere.Repositories
{
    public interface IUserRepository
    {
        User? GetById(int id);
        User? GetByEmail(string email);
        void Add(User user);
        IEnumerable<User> GetAll();
    }
}
