import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Bot, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const Menu = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [shareableCode, setShareableCode] = useState('');
  const [copied, setCopied] = useState(false);

  const generateRoomCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setShareableCode(code);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/multiplayer/${shareableCode}`);
      setCopied(true);
      toast.success('Room link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const startSinglePlayer = () => {
    navigate('/singleplayer');
  };

  const createMultiplayerRoom = () => {
    if (!shareableCode) {
      generateRoomCode();
      return;
    }
    navigate(`/multiplayer/${shareableCode}`);
  };

  const joinMultiplayerRoom = () => {
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    navigate(`/multiplayer/${roomCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-felt-green flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-foreground mb-4">Golf Card Game</h1>
          <p className="text-xl text-muted-foreground">Choose your game mode</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Single Player Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Bot className="w-6 h-6" />
                Single Player
              </CardTitle>
              <CardDescription>
                Play against the computer
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={startSinglePlayer}
                className="w-full"
                size="lg"
              >
                Start Game
              </Button>
            </CardContent>
          </Card>

          {/* Multiplayer Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="w-6 h-6" />
                Multiplayer
              </CardTitle>
              <CardDescription>
                Play with a friend online
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create Room */}
              <div className="space-y-2">
                <Button 
                  onClick={createMultiplayerRoom}
                  className="w-full"
                  variant={shareableCode ? "secondary" : "default"}
                  size="lg"
                >
                  {shareableCode ? 'Join Room' : 'Create Room'}
                </Button>
                
                {shareableCode && (
                  <div className="flex gap-2 items-center">
                    <Input 
                      value={`${window.location.origin}/multiplayer/${shareableCode}`}
                      readOnly
                      className="text-xs text-white"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      size="sm"
                      className="shrink-0 text-white"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>

              {/* Join Room */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground text-center">or</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter room code"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                    className="uppercase text-white"
                    maxLength={6}
                  />
                  <Button 
                    onClick={joinMultiplayerRoom}
                    variant="outline"
                    className="text-white"
                  >
                    Join
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules Summary */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-center text-white">Quick Rules</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white space-y-2">
            <p>• Get your 4 cards to total exactly 0 points</p>
            <p>• Peek at 2 cards to start, then take turns drawing and replacing</p>
            <p>• Jacks & 2s = 0 points, Aces = 11, Face cards = 10</p>
            <p>• First player to reach 100 total points loses</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Menu;