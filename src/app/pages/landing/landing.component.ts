import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent implements OnInit, OnDestroy {
  currentStatIndex = signal(0);
  private interval: ReturnType<typeof setInterval> | null = null;

  features = [
    {
      icon: '⚡',
      title: 'Instant Splits',
      description:
        'Split any expense in seconds. Equal splits, custom amounts, or percentage-based — your choice.',
    },
    {
      icon: '🏠',
      title: 'House Groups',
      description:
        'Create dedicated spaces for roommates, families, or any shared living arrangement.',
    },
    {
      icon: '📊',
      title: 'Smart Analytics',
      description:
        'Visualize spending patterns, track monthly trends, and understand where your money goes.',
    },
    {
      icon: '🔔',
      title: 'Real-time Sync',
      description:
        'Every expense updates instantly across all members. No more out-of-date balances.',
    },
    {
      icon: '💳',
      title: 'Settlement Tracking',
      description:
        'Know exactly who owes what. Settle debts with a single tap and keep records clean.',
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description:
        'Bank-level encryption keeps your financial data safe. Your data, your control.',
    },
  ];

  stats = [
    { value: '100%', label: 'Transparent' },
    { value: '0', label: 'Hidden Fees' },
    { value: '∞', label: 'Unlimited Groups' },
    { value: '24/7', label: 'Cloud Sync' },
  ];

  steps = [
    {
      number: '01',
      title: 'Create Your House',
      description: 'Set up a group for your home, apartment, or any shared space in under a minute.',
    },
    {
      number: '02',
      title: 'Add Housemates',
      description: 'Invite your roommates or family members via email. They join with one click.',
    },
    {
      number: '03',
      title: 'Log Expenses',
      description: 'Add any shared expense and choose how to split it among members.',
    },
    {
      number: '04',
      title: 'Settle Up',
      description: 'See a clean summary of who owes what and settle balances effortlessly.',
    },
  ];

  ngOnInit(): void {
    this.interval = setInterval(() => {
      this.currentStatIndex.update((i) => (i + 1) % this.stats.length);
    }, 2500);
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  // Waitlist State
  email = '';
  waitlistState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  waitlistErrorMsg = '';

  async submitWaitlist(event: Event) {
    event.preventDefault();
    if (!this.email) return;

    this.waitlistState.set('loading');
    this.waitlistErrorMsg = '';

    const webhookUrl = 'https://script.google.com/macros/s/AKfycbzaWqcggCyv6yHi11Fl_FVkwtTcXpNb1dTWbQ4_aP_Ld5qszU7iQVnZj1vMHHa4X22-DQ/exec';
    
    try {
      // Fire and forget to avoid being blocked by Google Script redirects/CORS
      fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({ email: this.email })
      });

      // Update state immediately to ensure the user sees the success message
      this.waitlistState.set('success');
      this.email = '';

    } catch (err) {
      console.error('Waitlist submission error:', err);
      this.waitlistState.set('error');
      this.waitlistErrorMsg = 'Failed to submit. Please try again later.';
    }
  }
}
