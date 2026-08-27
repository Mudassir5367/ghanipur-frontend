import { Card, CardBody } from './Card';

/** Placeholder for modules delivered in later phases. Keeps navigation from 404ing. */
export function ComingSoon({ title, phase, description }: { title: string; phase: string; description?: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-xl">🚧</div>
          <p className="text-base font-medium text-slate-700">Coming in {phase}</p>
          <p className="max-w-md text-sm text-slate-500">
            {description ?? 'This module is being built as part of the phased rollout.'}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
