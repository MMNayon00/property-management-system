const bcrypt = require('bcryptjs'); // Assuming NextAuth uses bcryptjs or similar
bcrypt.hash('password123', 10, function(err, hash) {
  console.log(hash);
});
