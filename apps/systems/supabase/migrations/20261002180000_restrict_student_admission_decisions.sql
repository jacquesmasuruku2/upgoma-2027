DROP POLICY IF EXISTS "Authenticated can update students" ON public.students;
CREATE POLICY "Admissions staff can update students"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'appariteur'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin'::public.app_role)
    OR public.has_role(auth.uid(), 'appariteur'::public.app_role)
  );

DROP POLICY IF EXISTS "Admins can delete students" ON public.students;
CREATE POLICY "Super admins can delete students"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'::public.app_role));