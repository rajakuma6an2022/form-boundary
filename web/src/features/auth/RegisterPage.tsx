import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation } from 'react-router';
import { z } from 'zod';
import { registerAccount } from '../../api/auth';
import { ApiError } from '../../api/errors';
import { validationDetailsSchema } from '../../api/schemas';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { AuthLayout } from './AuthLayout';
import { PasswordToggle, ServerAlert } from './auth-parts';
import { describeAuthError } from './messages';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80, 'Name must be 80 characters or fewer'),
  email: z.string().trim().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(10, 'Password must be at least 10 characters').max(128, 'Password must be 128 characters or fewer'),
});
type Values = z.infer<typeof schema>;

export function RegisterPage() {
  const { search } = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerAccount(values);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('email', { message: 'An account with this email already exists.' }, { shouldFocus: true });
        return;
      }
      if (err instanceof ApiError && err.status === 400) {
        const details = validationDetailsSchema.safeParse(err.details);
        if (details.success) {
          let handled = false;
          for (const detail of details.data) {
            if (detail.path === 'name' || detail.path === 'email' || detail.path === 'password') {
              setError(detail.path, { message: detail.message });
              handled = true;
            }
          }
          if (handled) return;
        }
      }
      setServerError(describeAuthError(err, 'register'));
    }
  });

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Build forms and collect responses in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to={{ pathname: '/login', search }} className="font-medium text-primary underline hover:text-primary-hover">
            Sign in
          </Link>
        </>
      }
    >
      <ServerAlert message={serverError} />
      <form noValidate onSubmit={onSubmit} className="space-y-4">
        <TextField label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={errors.password?.message}
          trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((value) => !value)} />}
          {...register('password')}
        />
        <p className="text-xs text-ink-muted">Use at least 10 characters.</p>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
}