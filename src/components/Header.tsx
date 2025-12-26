import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showTheme?: boolean;
}

export const Header = ({ title, showBack = false, showTheme = true }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {title && <h1 className="text-lg font-bold">{title}</h1>}
        </div>
        {showTheme && <ThemeToggle />}
      </div>
    </header>
  );
};
