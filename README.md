# MoneyMint 🍃

**Smart Finance, Simple Living** — A modern, responsive personal finance management web application.

## Features

- **Landing Page** — Hero section with animated gradient, feature highlights, CTA
- **Authentication** — Login/Signup with animated background, form validation, remember-me
- **Dashboard** — Summary cards (Balance, Expenses, Investments, Savings), recent transactions, smart insights
- **Expense Tracker** — Add/Edit/Delete expenses with categories, filtering, search, monthly totals
- **Investment Tracker** — Track stocks, mutual funds, crypto, gold, SIP, FD with portfolio distribution
- **Analytics** — Pie chart (category breakdown), bar chart (monthly trends), doughnut chart (investments), line chart (savings)
- **Transaction History** — Unified table with search, type filter, CSV export
- **Budget Planning** — Set monthly budgets per category, progress bars, overspend warnings
- **Dark/Light Mode** — Theme toggle with localStorage persistence
- **Responsive Design** — Desktop, tablet, and mobile layouts
- **Glassmorphism UI** — Modern SaaS aesthetic with smooth animations

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| HTML5 | Structure |
| CSS3 | Styling, animations, responsive layout |
| Vanilla JS | All application logic |
| Chart.js | Interactive charts (pie, bar, doughnut, line) |
| Lucide Icons | Clean SVG icon set |
| LocalStorage | Data persistence |

## Usage

1. Run `npm start` or `npm run dev` to start the server
2. Open `http://localhost:5000` in your browser
3. Click **Get Started** or navigate to the landing page
4. Create an account on the signup page
5. Log in to access the dashboard
6. Start adding expenses, investments, and setting budgets

## Project Structure

```
MoneyMint/
├── frontend/
│   ├── index.html          Landing page
│   ├── login.html          Authentication
│   ├── signup.html         Registration
│   ├── dashboard.html      Main application
│   ├── assets/
│   ├── css/
│   │   ├── style.css       Variables, typography, glassmorphism, animations
│   │   ├── dashboard.css   Sidebar, cards, tables, modals, charts
│   │   └── responsive.css  All breakpoints
│   └── js/
│       ├── auth.js         Authentication & session management
│       ├── utils.js        Helpers, toasts, export, date utilities
│       ├── expenses.js     Expense CRUD with filtering
│       ├── investments.js  Investment CRUD with distribution
│       ├── charts.js       Chart.js integration
│       └── app.js          Navigation, theme, dashboard logic
├── backend/
│   ├── server.js           Express app entry point
│   ├── config/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   └── helpers/
├── package.json
└── README.md
```
"# MoneyMint-Project" 
