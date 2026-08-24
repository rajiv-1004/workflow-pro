import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Mail, Lock, User as UserIcon, Building, ArrowRight, Loader2 } from 'lucide-react';
import { authApi } from '../../api/endpoints';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/errors';
import { ErrorMessage } from '../../components/common/ErrorMessage';

const registerSchema = z.object({
  company_name: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(150, 'Company name is too long'),
  full_name: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name is too long'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password is too long'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company_name: '',
      full_name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setServerError(null);
      setIsSubmitting(true);

      // 1. Register user & company in backend
      const registeredUser = await authApi.register({
        company_name: values.company_name,
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      });

      // 2. Automatically log in to obtain JWT access token
      const tokenResponse = await authApi.login({
        email: values.email,
        password: values.password,
      });

      await login(tokenResponse.access_token, registeredUser);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100">
        {/* Brand & Header */}
        <div className="text-center">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-brand-600 items-center justify-center text-white shadow-lg shadow-brand-500/25 mb-4">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Create an Account
          </h2>
          <p className="text-sm text-slate-500 mt-1.5">
            Set up your organization on <span className="font-semibold text-slate-700">WorkFlow Pro</span>
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <ErrorMessage
            message={serverError}
            onDismiss={() => setServerError(null)}
          />
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Company Name */}
          <div>
            <label
              htmlFor="company_name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Company / Organization Name
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building className="w-4 h-4" />
              </div>
              <input
                id="company_name"
                type="text"
                disabled={isSubmitting}
                {...register('company_name')}
                placeholder="Acme Corporation"
                className={`block w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                  errors.company_name ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.company_name && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.company_name.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Your Full Name
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="full_name"
                type="text"
                disabled={isSubmitting}
                {...register('full_name')}
                placeholder="Jane Doe"
                className={`block w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                  errors.full_name ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.full_name && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Work Email
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                {...register('email')}
                placeholder="jane@acme.com"
                className={`block w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                  errors.email ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative rounded-lg shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register('password')}
                placeholder="Min 8 characters"
                className={`block w-full pl-10 pr-3.5 py-2.5 bg-slate-50/50 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                  errors.password ? 'border-rose-300 ring-rose-200' : 'border-slate-200'
                }`}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mt-2 border border-transparent rounded-lg shadow-md shadow-brand-600/20 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
