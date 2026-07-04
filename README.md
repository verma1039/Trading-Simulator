# Real-Time Trading Simulator

A live paper-trading platform for exploring major US stocks, tracking portfolio performance, and practicing trading decisions without real-money risk.

## Live Demo

[Open the live website](https://real-time-trading-simulator.vercel.app)

## Overview

Real-Time Trading Simulator is built to feel like a modern trading workspace. Users can create an account, receive virtual capital, browse live market data, place simulated buy and sell orders, and track portfolio performance over time.

The application combines a polished trading interface with backend-enforced account, portfolio, transaction, and admin workflows.

## Core Features

- Email/password authentication through Supabase Auth.
- Required signup profile details including name, mobile number, and date of birth.
- One-time virtual joining bonus credited on first login.
- Live Yahoo Finance-backed market quotes for supported US stocks.
- Market status awareness for US trading sessions.
- Simulated buy and sell flow using current market quotes.
- Persistent portfolio, wallet, holdings, orders, transactions, and deposit requests.
- Portfolio valuation with live prices and unrealized profit/loss.
- Deposit request workflow with admin approval or rejection.
- Admin operations console for user, deposit, and account management.
- IST-first account timezone display.

## User Workspace

The user workspace includes:

- Dashboard
- Trade terminal
- Portfolio workspace
- Buy/Sell order ticket
- Transactions and deposit requests
- Account settings

Users can review their account value, available cash, holdings, market conditions, activity history, and transaction records from a single connected experience.

## Admin Workspace

Admins can access an operations console to:

- Review users
- Inspect account details
- Approve or reject deposit requests
- Suspend or activate user accounts
- Review admin activity

Admin access is controlled by backend role resolution and persisted profile roles.

## Technology

Frontend:

- React
- Vite
- Tailwind CSS
- shadcn/ui-style components
- Recharts
- Lucide Icons
- Framer Motion

Backend:

- FastAPI
- Supabase Auth JWT verification
- Supabase PostgreSQL persistence
- Yahoo Finance market data provider

Database:

- Supabase PostgreSQL
- Row-Level Security policies
- Repository-backed persistence layer

## Trading Scope

This is a simulator. Orders are virtual, funds are virtual, and no broker integration or real-money trading is performed.

The platform is designed for learning, testing strategies, and practicing portfolio decisions in a realistic market-data environment.
