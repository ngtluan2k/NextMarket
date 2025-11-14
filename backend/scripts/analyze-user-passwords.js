const mysql = require('mysql2/promise');
require('dotenv').config();

async function analyzeUserPasswords() {
  console.log(' Analyzing User Password Hash Performance\n');
  
  // Database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'nextmarket'
  });
  
  try {
   
    const [users] = await connection.execute(
      'SELECT id, email, username, password, created_at FROM users LIMIT 100'
    );
    
    console.log(`Found ${users.length} users to analyze\n`);
    console.log('=' .repeat(80));
    
    const saltRoundsStats = {};
    const problematicUsers = [];
    
    for (const user of users) {
      const hash = user.password;
      
      // Parse bcrypt hash: $2a$rounds$salt+hash
      const parts = hash.split('$');
      if (parts.length >= 3) {
        const saltRounds = parseInt(parts[2], 10);
        
        // Count salt rounds distribution
        saltRoundsStats[saltRounds] = (saltRoundsStats[saltRounds] || 0) + 1;
        
        // Identify problematic users (high salt rounds)
        if (saltRounds >= 14) {
          const estimatedLoginTime = saltRounds === 14 ? '~3s' : 
                                   saltRounds === 15 ? '~6s' : 
                                   saltRounds === 16 ? '~12s' : 
                                   saltRounds >= 17 ? '~20s+' : 'Unknown';
          
          problematicUsers.push({
            id: user.id,
            email: user.email,
            username: user.username,
            saltRounds,
            estimatedLoginTime,
            created_at: user.created_at
          });
        }
        
        console.log(`User ${user.id.toString().padStart(3)} | ${user.email.padEnd(25)} | Salt: ${saltRounds.toString().padStart(2)} | ${saltRounds >= 14 ? '🔴 SLOW' : saltRounds >= 12 ? '🟡 OK' : '🟢 FAST'}`);
      }
    }
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 SALT ROUNDS DISTRIBUTION:');
    Object.entries(saltRoundsStats)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([rounds, count]) => {
        const percentage = ((count / users.length) * 100).toFixed(1);
        const performance = rounds >= 14 ? ' Slow' : rounds >= 12 ? ' OK' : 'Fast';
        console.log(`  Salt ${rounds.padStart(2)}: ${count.toString().padStart(3)} users (${percentage.padStart(5)}%) ${performance}`);
      });
    
    if (problematicUsers.length > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log(` PROBLEMATIC USERS (${problematicUsers.length} users with slow login):`);
      console.log('These users will experience 3+ second login delays:\n');
      
      problematicUsers.forEach(user => {
        console.log(`  ID: ${user.id.toString().padStart(3)} | ${user.email.padEnd(25)} | Salt: ${user.saltRounds} | Login: ${user.estimatedLoginTime}`);
      });
      
      console.log('\n SOLUTIONS:');
      console.log('1.  AUTOMATIC: Updated code will rehash passwords on next successful login');
      console.log('2.  MANUAL: Run password migration script (if you want immediate fix)');
      console.log('3.  NOTIFY: Consider notifying affected users about temporary login delays');
      
      console.log('\n EXPECTED IMPROVEMENT:');
      console.log(`- Current: ${problematicUsers.length} users with 3-12+ second logins`);
      console.log(`- After fix: All users will have <300ms logins`);
      console.log(`- Performance gain: 10-40x faster login for affected users`);
    } else {
      console.log('\n All users have acceptable password performance!');
    }
    
  } catch (error) {
    console.error(' Error analyzing passwords:', error.message);
  } finally {
    await connection.end();
  }
}

// Run the analysis
analyzeUserPasswords().catch(console.error);
