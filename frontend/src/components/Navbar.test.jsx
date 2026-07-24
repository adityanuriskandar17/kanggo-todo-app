import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

const renderNavbar = (user, onLogout = vi.fn()) => {
  return render(
    <BrowserRouter>
      <Navbar user={user} onLogout={onLogout} />
    </BrowserRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should render app name', () => {
    renderNavbar(null);
    expect(screen.getByText('Kanggo')).toBeInTheDocument();
  });

  it('should show user name when logged in', () => {
    renderNavbar({ nama: 'Budi' });
    expect(screen.getByText('Budi')).toBeInTheDocument();
    expect(screen.getByText(/Halo,/)).toBeInTheDocument();
  });

  it('should show logout button when logged in', () => {
    renderNavbar({ nama: 'Budi' });
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should not show user info when not logged in', () => {
    renderNavbar(null);
    expect(screen.queryByText(/Halo,/)).not.toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('should call onLogout and clear storage on logout click', () => {
    localStorage.setItem('token', 'abc');
    localStorage.setItem('user', JSON.stringify({ nama: 'Budi' }));

    const onLogout = vi.fn();
    renderNavbar({ nama: 'Budi' }, onLogout);

    fireEvent.click(screen.getByText('Logout'));
    expect(onLogout).toHaveBeenCalled();
  });
});
