import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  LucideIconData,
  Zap,
  Scale,
  History,
  Users,
  ArrowLeftRight,
  ShoppingCart,
  Globe,
  Check,
} from 'lucide-angular';

@Component({
  selector: 'app-landing',
  imports: [CommonModule, RouterLink, FormsModule, LucideAngularModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  readonly ShoppingCart = ShoppingCart;
  readonly Zap = Zap;
  readonly Globe = Globe;
  readonly Check = Check;

  features: { icon: LucideIconData; title: string; description: string }[] = [
    {
      icon: Zap,
      title: 'Automatic balances',
      description:
        'The moment an expense is added, every flatmate\'s balance updates instantly, so there\'s never a debate about the numbers.',
    },
    {
      icon: Scale,
      title: 'Flexible splitting',
      description:
        'Not everything divides equally. Split by percentage, by specific amounts, or just mark it as one person\'s responsibility.',
    },
    {
      icon: History,
      title: 'Expense history',
      description:
        'Every rupee, every purchase, every person who paid, all in one place when month-end rolls around.',
    },
    {
      icon: Users,
      title: 'Group expense tracking',
      description:
        'One group for the whole flat. Everyone can see what\'s been added, who contributed, and what\'s still outstanding.',
    },
    {
      icon: ArrowLeftRight,
      title: 'Settlement suggestions',
      description:
        'When it\'s time to settle up, Barabar tells you the simplest way to clear all balances, usually fewer transactions than you\'d expect.',
    },
  ];

  steps = [
    {
      number: '01',
      title: 'Create your group',
      description: 'Add your flatmates. Takes about thirty seconds, no setup drama.',
    },
    {
      number: '02',
      title: 'Add expenses as they happen',
      description:
        'Someone pays for gas? Enter who paid, how much, and split it however makes sense.',
    },
    {
      number: '03',
      title: 'Barabar does the math',
      description:
        'See exactly who owes whom. No spreadsheet, no argument, no guessing.',
    },
  ];

  painPoints = [
    {
      headline: 'The "yaar tu mujhe 1,500 deta tha na" moment.',
      body: 'You paid for groceries three weeks ago. Nobody acknowledged it. Now it\'s month-end and you\'re doing the math in your head while your flatmate sits there acting confused. You know the feeling.',
    },
    {
      headline: 'The WhatsApp voice note war.',
      body: 'Electricity bill comes. Someone shares it in the group. Three voice notes later, nobody agrees on who paid for the internet last month, and the landlord is already texting.',
    },
    {
      headline: 'The one flatmate who always "forgets."',
      body: 'He\'s not broke. He\'s not a bad person. He just has a mysteriously convenient memory when it comes to his share. You don\'t want to fight. You just want your money.',
    },
    {
      headline: 'The silence after someone pays for dinner.',
      body: 'You covered the biryani for the whole table. You said "we\'ll sort it later." It\'s been six days. The silence is doing something to you.',
    },
  ];

  testimonials = [
    {
      quote:
        'We used to fight about bills every month without fail. Someone would always say they didn\'t remember agreeing to pay that amount. Now we just open Barabar and the numbers are right there. Nobody can argue with the app.',
      name: 'Haris M.',
      location: 'Lahore',
    },
    {
      quote:
        'I was the one always calculating on my phone calculator and sending it in the group chat. My flatmates would double-check it anyway. Now I just send them the Barabar link and we\'re done.',
      name: 'Zara K.',
      location: 'Islamabad',
    },
    {
      quote:
        'Honestly I didn\'t realize how much tension living with people can create until the money stuff just stopped being a thing. It sounds small but it genuinely changed the vibe in our flat.',
      name: 'Bilal A.',
      location: 'Karachi',
    },
  ];

  // Waitlist State
  email = '';
  waitlistState = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  waitlistErrorMsg = '';

  async submitWaitlist(event: Event) {
    event.preventDefault();
    if (!this.email) return;

    this.waitlistState.set('loading');
    this.waitlistErrorMsg = '';

    const webhookUrl =
      'https://script.google.com/macros/s/AKfycbzaWqcggCyv6yHi11Fl_FVkwtTcXpNb1dTWbQ4_aP_Ld5qszU7iQVnZj1vMHHa4X22-DQ/exec';

    try {
      fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ email: this.email }),
      });

      this.waitlistState.set('success');
      this.email = '';
    } catch (err) {
      console.error('Waitlist submission error:', err);
      this.waitlistState.set('error');
      this.waitlistErrorMsg = 'Failed to submit. Please try again later.';
    }
  }
}
