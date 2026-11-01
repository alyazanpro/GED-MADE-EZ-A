export enum DomainEvent {
  // User events
  USER_REGISTERED = "user.registered",
  USER_SIGNED_IN = "user.signed_in",
  USER_PROFILE_UPDATED = "user.profile_updated",
  USER_ONBOARDING_COMPLETED = "user.onboarding_completed",
  
  // Class events
  CLASS_CREATED = "class.created",
  CLASS_UPDATED = "class.updated",
  CLASS_DELETED = "class.deleted",
  STUDENT_JOINED_CLASS = "student.joined_class",
  STUDENT_LEFT_CLASS = "student.left_class",
  
  // Assignment events
  ASSIGNMENT_CREATED = "assignment.created",
  ASSIGNMENT_UPDATED = "assignment.updated",
  ASSIGNMENT_DELETED = "assignment.deleted",
  ASSIGNMENT_COMPLETED = "assignment.completed",
  ASSIGNMENT_OVERDUE = "assignment.overdue",
  
  // Progress events
  PROGRESS_SYNCED = "progress.synced",
  TOPIC_COMPLETED = "topic.completed",
  TOPIC_MASTERY_ACHIEVED = "topic.mastery_achieved",
  EXAM_COMPLETED = "exam.completed",
  STUDY_GOAL_ACHIEVED = "study_goal_achieved",
  
  // Teacher events
  TEACHER_ROLE_GRANTED = "teacher.role_granted",
  TEACHER_ROLE_REVOKED = "teacher.role_revoked",
  
  // System events
  SYSTEM_ERROR = "system.error",
  SYSTEM_MAINTENANCE = "system.maintenance"
}

export interface DomainEventData {
  type: DomainEvent;
  data: unknown;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

export type EventHandler = (event: DomainEventData) => Promise<void> | void;

class EventEmitter {
  private handlers: Map<DomainEvent, EventHandler[]> = new Map();
  private asyncHandlers: Map<DomainEvent, EventHandler[]> = new Map();

  on(event: DomainEvent, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  onAsync(event: DomainEvent, handler: EventHandler): void {
    if (!this.asyncHandlers.has(event)) {
      this.asyncHandlers.set(event, []);
    }
    this.asyncHandlers.get(event)!.push(handler);
  }

  off(event: DomainEvent, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
    
    const asyncHandlers = this.asyncHandlers.get(event);
    if (asyncHandlers) {
      const index = asyncHandlers.indexOf(handler);
      if (index > -1) {
        asyncHandlers.splice(index, 1);
      }
    }
  }

  async emit(event: DomainEvent, data: unknown, userId?: string, metadata?: Record<string, unknown>): Promise<void> {
    const eventData: DomainEventData = {
      type: event,
      data,
      timestamp: new Date().toISOString(),
      userId,
      metadata
    };

    // Execute synchronous handlers
    const handlers = this.handlers.get(event) || [];
    for (const handler of handlers) {
      try {
        handler(eventData);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    }

    // Execute async handlers
    const asyncHandlers = this.asyncHandlers.get(event) || [];
    const asyncPromises = asyncHandlers.map(handler =>
      Promise.resolve(handler(eventData)).catch((error: unknown) => {
        console.error(`Error in async event handler for ${event}:`, error);
      })
    );
    
    await Promise.all(asyncPromises);
  }

  async emitAsync(event: DomainEvent, data: unknown, userId?: string, metadata?: Record<string, unknown>): Promise<void> {
    // Fire and forget - don't await
    this.emit(event, data, userId, metadata).catch(error => {
      console.error(`Error in async emit for ${event}:`, error);
    });
  }

  getHandlerCount(event: DomainEvent): number {
    const syncCount = this.handlers.get(event)?.length || 0;
    const asyncCount = this.asyncHandlers.get(event)?.length || 0;
    return syncCount + asyncCount;
  }

  clear(): void {
    this.handlers.clear();
    this.asyncHandlers.clear();
  }
}

// Global event emitter instance
export const eventEmitter = new EventEmitter();

// Convenience functions
export function on(event: DomainEvent, handler: EventHandler): void {
  eventEmitter.on(event, handler);
}

export function onAsync(event: DomainEvent, handler: EventHandler): void {
  eventEmitter.onAsync(event, handler);
}

export function off(event: DomainEvent, handler: EventHandler): void {
  eventEmitter.off(event, handler);
}

export async function emit(event: DomainEvent, data: unknown, userId?: string, metadata?: Record<string, unknown>): Promise<void> {
  await eventEmitter.emit(event, data, userId, metadata);
}

export function emitAsync(event: DomainEvent, data: unknown, userId?: string, metadata?: Record<string, unknown>): void {
  eventEmitter.emitAsync(event, data, userId, metadata);
}

// Example event handlers for common scenarios
export function setupDefaultEventHandlers(): void {
  // Assignment completion handler
  onAsync(DomainEvent.ASSIGNMENT_COMPLETED, async (event) => {
    const { assignmentId, studentId } = event.data as any;
    console.log(`Assignment ${assignmentId} completed by student ${studentId}`);
    // Could trigger notifications, analytics updates, etc.
  });

  // Topic mastery achievement handler
  onAsync(DomainEvent.TOPIC_MASTERY_ACHIEVED, async (event) => {
    const { topic, mastery } = event.data as any;
    console.log(`Topic ${topic} achieved mastery: ${mastery}%`);
    // Could trigger achievements, recommendations, etc.
  });

  // Class creation handler
  onAsync(DomainEvent.CLASS_CREATED, async (event) => {
    const { classId, teacherEmail } = event.data as any;
    console.log(`Class ${classId} created by ${teacherEmail}`);
    // Could trigger welcome emails, setup tasks, etc.
  });

  // Student joined class handler
  onAsync(DomainEvent.STUDENT_JOINED_CLASS, async (event) => {
    const { classId, studentEmail } = event.data as any;
    console.log(`Student ${studentEmail} joined class ${classId}`);
    // Could trigger notifications to teacher, etc.
  });
}
