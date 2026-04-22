import { Component, OnInit, signal, HostListener, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SwUpdate } from '@angular/service-worker';

const DISMISSED_KEY = 'pwa_prompt_dismissed_until';
const DISMISS_DAYS = 7;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  showPrompt = signal(false);
  isIOS = signal(false);

  private deferredPrompt: any = null;
  private swUpdate = inject(SwUpdate);

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(event: Event) {
    event.preventDefault();
    this.deferredPrompt = event;
    if (this.shouldShow()) {
      this.showPrompt.set(true);
    }
  }

  ngOnInit() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((evt) => {
        if (evt.type === 'VERSION_READY') {
          document.location.reload();
        }
      });
      this.swUpdate.checkForUpdate();
    }

    // Don't show if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      return;
    }

    if (!this.shouldShow()) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) {
      this.isIOS.set(true);
      this.showPrompt.set(true);
    }
    // For Android/Chrome the @HostListener above fires and sets showPrompt
  }

  async install() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    this.showPrompt.set(false);
    if (outcome === 'dismissed') {
      this.saveDismissal();
    }
  }

  dismiss() {
    this.showPrompt.set(false);
    this.saveDismissal();
  }

  private shouldShow(): boolean {
    const until = localStorage.getItem(DISMISSED_KEY);
    if (!until) return true;
    return Date.now() > parseInt(until, 10);
  }

  private saveDismissal() {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
  }
}
