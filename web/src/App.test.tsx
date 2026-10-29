import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('app shell', () => {
  it('shows the four nav items with Forms active', () => {
    renderAt('/forms');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    for (const name of ['Dashboard', 'Forms', 'Responses', 'Settings']) {
      expect(within(nav).getByRole('link', { name })).toBeInTheDocument();
    }
    expect(within(nav).getByRole('link', { name: 'Forms' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('shows the page title, search and new-form button', () => {
    renderAt('/forms');
    expect(screen.getByRole('heading', { level: 1, name: 'Forms' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search forms' })).toHaveAttribute('placeholder', 'Search forms…');
    expect(screen.getByRole('button', { name: 'New form' })).toBeInTheDocument();
  });

  it('shows the signed-in user and a log out button', () => {
    renderAt('/forms');
    expect(screen.getByText('Raja Kumar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });

  it('redirects / to /forms', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Forms' })).toBeInTheDocument();
  });
});

describe('forms screen', () => {
  it('shows three summary cards', () => {
    renderAt('/forms');
    expect(screen.getByText('Total forms').nextElementSibling).toHaveTextContent('12');
    expect(screen.getByText('Total responses').nextElementSibling).toHaveTextContent('486');
  });

  it('lists six forms with status pills', () => {
    renderAt('/forms');
    const table = screen.getByRole('table', { name: 'Your forms' });
    expect(within(table).getAllByRole('row')).toHaveLength(7); // header + 6
    expect(within(table).getAllByText('Published')).toHaveLength(4);
    expect(within(table).getAllByText('Draft')).toHaveLength(2);
  });

  it('filters rows from the header search', async () => {
    const user = userEvent.setup();
    renderAt('/forms');
    await user.type(screen.getByRole('searchbox', { name: 'Search forms' }), 'contact');
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(2);
    expect(within(table).getByText('Contact Us')).toBeInTheDocument();
  });

  it('shows a no-match message', () => {
    renderAt('/forms?q=zzz');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText(/No forms match/)).toBeInTheDocument();
  });

  it('shows the empty state', () => {
    renderAt('/forms?state=empty');
    expect(screen.getByRole('heading', { name: 'No forms yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create your first form' })).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('shows the loading skeleton', () => {
    renderAt('/forms?state=loading');
    expect(screen.getByRole('status')).toHaveTextContent('Loading forms');
  });

  it('shows the error state with a retry that restores the list', async () => {
    const user = userEvent.setup();
    renderAt('/forms?state=error');
    expect(screen.getByRole('alert')).toHaveTextContent('Couldn’t load your forms');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});

describe('row actions menu', () => {
  it('opens with six actions and closes on Escape, returning focus', async () => {
    const user = userEvent.setup();
    renderAt('/forms');
    const trigger = screen.getByRole('button', { name: 'Actions for Customer Feedback Survey' });

    await user.click(trigger);
    const items = screen.getAllByRole('menuitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Edit',
      'Preview',
      'Copy public link',
      'View responses',
      'Duplicate',
      'Delete',
    ]);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('moves focus with the arrow keys', async () => {
    const user = userEvent.setup();
    renderAt('/forms');
    await user.click(screen.getByRole('button', { name: 'Actions for Contact Us' }));
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Preview' })).toHaveFocus();
    await user.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });
});