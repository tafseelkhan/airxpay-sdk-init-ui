// src/events/sdkEvents.ts

import { EventEmitter } from 'events';

export type SDKEventType = 
  | 'onboarding:started'
  | 'onboarding:submitting'
  | 'onboarding:success'
  | 'onboarding:error'
  | 'token:missing'
  | 'token:refreshed'
  | 'token:cleared';  // ✅ Added this

export interface SDKEventData {
  type: SDKEventType;
  timestamp: number;
  data?: any;
}

class SDKEvents extends EventEmitter {
  private static instance: SDKEvents;

  private constructor() {
    super();
  }

  static getInstance(): SDKEvents {
    if (!SDKEvents.instance) {
      SDKEvents.instance = new SDKEvents();
    }
    return SDKEvents.instance;
  }

  emitEvent(type: SDKEventType, data?: any) {
    const eventData: SDKEventData = {
      type,
      timestamp: Date.now(),
      data
    };
    this.emit(type, eventData);
    
    if (__DEV__) {
      console.log(`[AirXPay Event] ${type}`, data ? '(with data)' : '');
    }
  }
}

export const sdkEvents = SDKEvents.getInstance();