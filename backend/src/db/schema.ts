import { pgTable, text, timestamp, doublePrecision, integer, json, serial, pgEnum, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['ADMIN', 'OPERATIONS', 'AUDITOR']);

// Users Table
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: roleEnum('role').default('OPERATIONS').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Devices Table
export const devices = pgTable('devices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  deviceId: text('device_id').notNull().unique(), // Unique hardware ID
  status: text('status').default('OFFLINE').notNull(),
  battery: doublePrecision('battery'),
  lastSeen: timestamp('last_seen'),
  lastSync: timestamp('last_sync'),
  firmware: text('firmware'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Device Configuration Table
export const deviceConfig = pgTable('device_config', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  deviceId: text('device_id').notNull().unique().references(() => devices.deviceId),
  minTemp: doublePrecision('min_temp').default(2.0).notNull(),
  maxTemp: doublePrecision('max_temp').default(8.0).notNull(),
  minHumidity: doublePrecision('min_humidity').default(30.0).notNull(),
  maxHumidity: doublePrecision('max_humidity').default(65.0).notNull(),
  minEthylene: doublePrecision('min_ethylene').default(0.0).notNull(),
  maxEthylene: doublePrecision('max_ethylene').default(150.0).notNull(),
  minShock: doublePrecision('min_shock').default(0.0).notNull(),
  maxShock: doublePrecision('max_shock').default(1.5).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Shipments Table
export const shipments = pgTable('shipments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  shipmentId: text('shipment_id').notNull().unique(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  status: text('status').default('PENDING').notNull(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  deviceId: text('device_id').references(() => devices.deviceId),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Telemetry Table
export const telemetry = pgTable('telemetry', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  deviceId: text('device_id').notNull().references(() => devices.deviceId),
  shipmentId: text('shipment_id').references(() => shipments.shipmentId),
  sequence: integer('sequence').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  temperature: doublePrecision('temperature'),
  humidity: doublePrecision('humidity'),
  ethylene: doublePrecision('ethylene'),
  battery: doublePrecision('battery'),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => {
  return {
    deviceSeqUnique: uniqueIndex('telemetry_device_seq_idx').on(table.deviceId, table.sequence),
    deviceTimeIdx: index('telemetry_device_time_idx').on(table.deviceId, table.timestamp)
  };
});

// Events Table
export const events = pgTable('events', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text('event_id').notNull().unique(),
  deviceId: text('device_id').notNull().references(() => devices.deviceId),
  shipmentId: text('shipment_id').references(() => shipments.shipmentId),
  sequence: integer('sequence').notNull(),
  eventType: text('event_type').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  payload: json('payload').notNull(), // Raw payload for hashing
  previousHash: text('previous_hash'),
  eventHash: text('event_hash').notNull(), // SHA256
  syncStatus: text('sync_status').default('SYNCED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => {
  return {
    deviceSeqUnique: uniqueIndex('events_device_seq_idx').on(table.deviceId, table.sequence),
    deviceTypeTimeIdx: index('events_device_type_time_idx').on(table.deviceId, table.eventType, table.timestamp)
  };
});

// Alerts Table
export const alerts = pgTable('alerts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  alertId: text('alert_id').notNull().unique(),
  eventId: text('event_id').notNull().unique().references(() => events.eventId),
  severity: text('severity').notNull(), // CRITICAL, WARNING, INFO
  type: text('type').notNull(),
  message: text('message').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  status: text('status').default('OPEN').notNull(), // OPEN, ACKNOWLEDGED, RESOLVED
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// EventEvidence Table (for images)
export const eventEvidence = pgTable('event_evidence', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  imageId: text('image_id').notNull().unique(),
  eventId: text('event_id').notNull().unique().references(() => events.eventId),
  deviceId: text('device_id').notNull(),
  shipmentId: text('shipment_id'),
  timestamp: timestamp('timestamp').notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  fileReference: text('file_reference').notNull(),
  sha256Hash: text('sha256_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Ledger Table
export const ledgerEntries = pgTable('ledger_entries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ledgerSequence: serial('ledger_sequence').unique().notNull(),
  eventId: text('event_id').notNull().unique().references(() => events.eventId),
  previousHash: text('previous_hash').notNull(),
  eventHash: text('event_hash').notNull(),
  canonicalPayload: text('canonical_payload').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// SyncBatches Table
export const syncBatches = pgTable('sync_batches', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  batchId: text('batch_id').notNull().unique(),
  deviceId: text('device_id').notNull().references(() => devices.deviceId),
  shipmentId: text('shipment_id').references(() => shipments.shipmentId),
  sequenceStart: integer('sequence_start').notNull(),
  sequenceEnd: integer('sequence_end').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  status: text('status').default('PROCESSED').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// BlockchainAnchors Table
export const blockchainAnchors = pgTable('blockchain_anchors', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  batchId: text('batch_id').notNull().unique().references(() => syncBatches.batchId),
  shipmentId: text('shipment_id'),
  sequenceStart: integer('sequence_start').notNull(),
  sequenceEnd: integer('sequence_end').notNull(),
  batchHash: text('batch_hash').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  blockchainNetwork: text('blockchain_network').notNull(),
  transactionReference: text('transaction_reference').notNull(),
  anchorStatus: text('anchor_status').default('PENDING').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Relations definitions (Optional but helpful for query builder)
export const devicesRelations = relations(devices, ({ many }) => ({
  shipments: many(shipments),
  telemetry: many(telemetry),
  events: many(events),
  syncBatches: many(syncBatches),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  device: one(devices, {
    fields: [shipments.deviceId],
    references: [devices.deviceId],
  }),
  telemetry: many(telemetry),
  events: many(events),
  syncBatches: many(syncBatches),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  device: one(devices, {
    fields: [events.deviceId],
    references: [devices.deviceId],
  }),
  shipment: one(shipments, {
    fields: [events.shipmentId],
    references: [shipments.shipmentId],
  }),
  ledgerEntry: one(ledgerEntries, {
    fields: [events.eventId],
    references: [ledgerEntries.eventId],
  }),
  alert: one(alerts, {
    fields: [events.eventId],
    references: [alerts.eventId],
  }),
  evidence: one(eventEvidence, {
    fields: [events.eventId],
    references: [eventEvidence.eventId],
  })
}));
