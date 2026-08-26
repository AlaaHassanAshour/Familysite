import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CouncilApiService, AppUserDto } from '../../council-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss'
})
export class UsersPageComponent implements OnInit {
  private readonly api = inject(CouncilApiService);
  readonly auth = inject(AuthService);

  users = signal<AppUserDto[]>([]);
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Modals state
  showCreateModal = signal(false);
  showEditModal = signal(false);
  showPasswordModal = signal(false);

  // Form Models
  newUser = {
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'Admin'
  };

  editUser = {
    id: 0,
    fullName: '',
    email: '',
    role: 'Admin',
    isActive: true
  };

  passwordModel = {
    userId: 0,
    userName: '',
    newPassword: ''
  };

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading.set(true);
    this.api.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'حدث خطأ أثناء تحميل قائمة المستخدمين');
        this.isLoading.set(false);
      }
    });
  }

  openCreateModal() {
    this.newUser = { username: '', password: '', fullName: '', email: '', role: 'Admin' };
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showCreateModal.set(true);
  }

  submitCreate() {
    if (!this.newUser.username || !this.newUser.password || !this.newUser.fullName) {
      this.errorMessage.set('يرجى تعبئة الحقول الإلزامية');
      return;
    }

    this.api.createUser(this.newUser).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.successMessage.set('تم إنشاء حساب المستخدم بنجاح');
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'تعذر إنشاء الحساب');
      }
    });
  }

  openEditModal(user: AppUserDto) {
    this.editUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email || '',
      role: user.role,
      isActive: user.isActive
    };
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showEditModal.set(true);
  }

  submitEdit() {
    if (!this.editUser.fullName) {
      this.errorMessage.set('الاسم الكامل مطلوب');
      return;
    }

    this.api.updateUser(this.editUser.id, this.editUser).subscribe({
      next: () => {
        this.showEditModal.set(false);
        this.successMessage.set('تم تحديث بيانات المستخدم بنجاح');
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'تعذر تحديث الحساب');
      }
    });
  }

  openPasswordModal(user: AppUserDto) {
    this.passwordModel = {
      userId: user.id,
      userName: user.fullName,
      newPassword: ''
    };
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.showPasswordModal.set(true);
  }

  submitPassword() {
    if (!this.passwordModel.newPassword || this.passwordModel.newPassword.length < 6) {
      this.errorMessage.set('كلمة المرور يجب أن تتكون من ٦ أحرف/أرقام على الأقل');
      return;
    }

    this.api.resetPassword(this.passwordModel.userId, this.passwordModel.newPassword).subscribe({
      next: () => {
        this.showPasswordModal.set(false);
        this.successMessage.set('تم تغيير كلمة المرور بنجاح');
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'تعذر تغيير كلمة المرور');
      }
    });
  }

  deleteUser(user: AppUserDto) {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المستخدم "${user.fullName}"؟`)) {
      return;
    }

    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.successMessage.set('تم حذف المستخدم بنجاح');
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'تعذر حذف المستخدم');
      }
    });
  }
}
