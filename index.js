const bedrock = require('bedrock-protocol');
const express = require('express');

// Configuration for the AFK bot
const config = {
  username: 'SukunaKaAFKBot',
  host: 'CrackerSMP-1mwp.aternos.me',
  port: 30293,
  offline: true,
  version: '1.21.100'
};

class MinecraftAFKBot {
  constructor(options = {}) {
    this.config = { ...config, ...options };
    this.client = null;
    this.isConnected = false;
    this.afkTimer = null;
  }

  // Connect to a Bedrock server
  async connect(host, port = 19132) {
    try {
      console.log(`🤖 Attempting to connect to ${host}:${port}...`);
      
      this.client = bedrock.createClient({
        host: host || this.config.host,
        port: port || this.config.port,
        username: this.config.username,
        offline: this.config.offline,
        version: this.config.version
      });

      this.setupEventHandlers();
      
    } catch (error) {
      console.error('❌ Failed to connect:', error.message);
      throw error;
    }
  }

  // Set up event handlers for the bot
  setupEventHandlers() {
    this.client.on('connect', () => {
      console.log('🔗 Connected to Bedrock server');
    });

    this.client.on('spawn', () => {
      console.log('🎮 Bot spawned in the world');
      this.isConnected = true;
      this.startAFKBehavior();
    });

    this.client.on('text', (packet) => {
      console.log(`💬 Message: ${packet.message || JSON.stringify(packet)}`);
    });

    this.client.on('disconnect', (packet) => {
      console.log('🔌 Disconnected from server:', packet.reason || 'Unknown reason');
      this.isConnected = false;
      this.stopAFKBehavior();
    });

    this.client.on('error', (error) => {
      console.error('❌ Client error:', error.message);
    });

    this.client.on('close', () => {
      console.log('📡 Connection closed');
      this.isConnected = false;
      this.stopAFKBehavior();
    });
  }

  // Start AFK behavior (subtle movements to prevent kick)
  startAFKBehavior() {
    console.log('⏰ Starting AFK behavior...');
    
    this.afkTimer = setInterval(() => {
      if (this.isConnected && this.client) {
        try {
          this.client.write('player_auth_input', {
            runtime_id: this.client.entityId || 1,
            position: { x: 0, y: 0, z: 0 },
            rotation: { yaw: Math.random() * 360, pitch: 0 },
            input_data: 0,
            input_mode: 1,
            play_mode: 0,
            tick: BigInt(Date.now())
          });
          console.log('🔄 Sent keep-alive movement');
        } catch (error) {
          console.log('⚠️  Could not send movement:', error.message);
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Stop AFK behavior
  stopAFKBehavior() {
    if (this.afkTimer) {
      clearInterval(this.afkTimer);
      this.afkTimer = null;
      console.log('⏹️  Stopped AFK behavior');
    }
  }

  // Disconnect from server
  disconnect() {
    if (this.client) {
      this.stopAFKBehavior();
      this.client.disconnect('Bot disconnecting');
      this.client = null;
      this.isConnected = false;
    }
  }

  // Check if a server is a Bedrock server
  static async pingServer(host, port = 19132) {
    try {
      const { ping } = require('bedrock-protocol');
      const result = await ping({ host, port });
      console.log(`🏓 Server info for ${host}:${port}:`);
      console.log(`   Name: ${result.name || 'Unknown'}`);
      console.log(`   Version: ${result.version || 'Unknown'}`);
      console.log(`   Players: ${result.players?.online || 0}/${result.players?.max || 0}`);
      console.log(`   Protocol: ${result.protocol || 'Unknown'}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to ping ${host}:${port}:`, error.message);
      throw error;
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Minecraft Bedrock AFK Bot Starting...');
  
  const bot = new MinecraftAFKBot();
  
  const serverHost = process.env.MC_SERVER_HOST || 'localhost';
  const serverPort = parseInt(process.env.MC_SERVER_PORT || '19132');
  const username = process.env.BOT_USERNAME || 'AFKBot';
  
  bot.config.username = username;
  
  try {
    console.log('🔍 Checking if server is Bedrock Edition...');
    await MinecraftAFKBot.pingServer(serverHost, serverPort);
    
    await bot.connect(serverHost, serverPort);
    
    console.log('✅ Bot is now running in AFK mode');
    
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down bot...');
      bot.disconnect();
      process.exit(0);
    });
    
    setInterval(() => {
      if (bot.isConnected) {
        console.log('📍 Bot is active and connected');
      }
    }, 300000); 
    
  } catch (error) {
    console.error('💥 Failed to start bot:', error.message);
    process.exit(1);
  }
}

// Run the bot
if (require.main === module) {
  main().catch(console.error);
}

module.exports = MinecraftAFKBot;

// =====================
// Express server (Render keep-alive)
// =====================
const app = express()

app.get("/", (req, res) => {
  res.send("🚀 Minecraft AFK Bot is running and alive on Render!")
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`)
})
