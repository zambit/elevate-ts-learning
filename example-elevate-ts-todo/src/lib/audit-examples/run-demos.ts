/**
 * Run all audit demos to see the audit system in action
 *
 * Usage: pnpm tsx src/lib/audit-examples/run-demos.ts
 */

import { demoSimpleAuditStepByStep } from './simple.demo.js';
import { demoPipelineAuditStepByStep } from './pipeline.demo.js';
import { demoTodoAuditStepByStep } from './todo-audit.demo.js';

console.log('\n🎬 Starting Audit System Demos\n');
console.log('═'.repeat(60));

console.log('\n📌 DEMO 1: Simple Audit (Basic tracking)\n');
demoSimpleAuditStepByStep();

console.log('\n' + '═'.repeat(60));

console.log('\n📌 DEMO 2: Pipeline Audit (Multi-step tracking)\n');
demoPipelineAuditStepByStep();

console.log('\n' + '═'.repeat(60));

console.log('\n📌 DEMO 3: Todo Audit (State tracking)\n');
demoTodoAuditStepByStep();

console.log('\n' + '═'.repeat(60));
console.log('\n✅ All demos completed!\n');
