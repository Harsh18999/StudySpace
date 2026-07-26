from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver
from django.utils import timezone
from django.db.models import Sum

from accounts.models import User, CreditWallet
from spaces.models import Module, Resource
from ai.models import (
    FlashCards, ResourseQuizes, ModuleQuizes, 
    ResourceQuizAttempt, ModuleQuizAttempt, Notes, ModuleFlashcards
)
from .models import ReportTags, ModuleProgress, StudySession
from payments.models import CreditUsage


@receiver(post_save, sender=User)
def create_report_tags(sender, instance, created, **kwargs):
    if created:
        ReportTags.objects.get_or_create(user=instance)
        CreditWallet.objects.get_or_create(user=instance)


@receiver(post_save, sender=Module)
def create_module_progress(sender, instance, created, **kwargs):
    if created:
        ModuleProgress.objects.get_or_create(module=instance)


@receiver(post_save, sender=Resource)
def update_report_resources(sender, instance, created, **kwargs):
    if created:
        user = instance.module.space.user
        report_tags, _ = ReportTags.objects.get_or_create(user=user)
        report_tags.resources += 1
        report_tags.total_items += 1
        report_tags.save()


@receiver(post_delete, sender=Resource)
def update_report_resources_delete(sender, instance, **kwargs):
    user = instance.module.space.user
    report_tags = ReportTags.objects.filter(user=user).first()
    if report_tags:
        report_tags.resources = max(0, report_tags.resources - 1)
        report_tags.total_items = max(0, report_tags.total_items - 1)
        report_tags.save()


@receiver(post_save, sender=ResourceQuizAttempt)
def update_resource_quiz_attempt(sender, instance, created, **kwargs):
    if instance.status == "SUBMITTED":
        user = instance.quiz.resource.module.space.user
        module = instance.quiz.resource.module
        report_tags, _ = ReportTags.objects.get_or_create(user=user)
        module_progress, _ = ModuleProgress.objects.get_or_create(module=module)

        module_progress.completed += 1
        module_progress.save()

        report_tags.completed_items += 1
        report_tags.average_accuracy = round((report_tags.average_accuracy + instance.score) / 2.0, 2)
        report_tags.save()


@receiver(post_save, sender=ModuleQuizAttempt)
def update_module_quiz_attempt(sender, instance, created, **kwargs):
    if instance.status == "SUBMITTED":
        user = instance.quiz.module.space.user
        module = instance.quiz.module
        report_tags, _ = ReportTags.objects.get_or_create(user=user)
        module_progress, _ = ModuleProgress.objects.get_or_create(module=module)

        module_progress.completed += 1
        module_progress.save()

        report_tags.completed_items += 1
        report_tags.average_accuracy = round((report_tags.average_accuracy + instance.score) / 2.0, 2)
        report_tags.save()


@receiver(post_delete, sender=ResourceQuizAttempt)
def update_resource_quiz_attempt_delete(sender, instance, **kwargs):
    if instance.status == "SUBMITTED":
        user = instance.quiz.resource.module.space.user
        module = instance.quiz.resource.module
        report_tags = ReportTags.objects.filter(user=user).first()
        module_progress = ModuleProgress.objects.filter(module=module).first()

        if module_progress:
            module_progress.completed = max(0, module_progress.completed - 1)
            module_progress.save()

        if report_tags:
            report_tags.completed_items = max(0, report_tags.completed_items - 1)
            if report_tags.quizzes > 0:
                report_tags.average_accuracy = round(max(0, (report_tags.average_accuracy - instance.score) / report_tags.quizzes), 2)
            report_tags.save()


@receiver(post_delete, sender=ModuleQuizAttempt)
def update_module_quiz_attempt_delete(sender, instance, **kwargs):
    if instance.status == "SUBMITTED":
        user = instance.quiz.module.space.user
        module = instance.quiz.module
        report_tags = ReportTags.objects.filter(user=user).first()
        module_progress = ModuleProgress.objects.filter(module=module).first()

        if module_progress:
            module_progress.completed = max(0, module_progress.completed - 1)
            module_progress.save()

        if report_tags:
            report_tags.completed_items = max(0, report_tags.completed_items - 1)
            if report_tags.quizzes > 0:
                report_tags.average_accuracy = round(max(0, (report_tags.average_accuracy - instance.score) / report_tags.quizzes), 2)
            report_tags.save()


@receiver(post_save, sender=FlashCards)
def update_flashcards(sender, instance, created, **kwargs):
    if created:
        user = instance.module.space.user
        report_tags, _ = ReportTags.objects.get_or_create(user=user)
        report_tags.flashcards += len(instance.content) 
        
        credit_wallet, _ = CreditWallet.objects.get_or_create(user=user, defaults={"balance": 0})
        cost = 10
        credit_wallet.debit(cost)
        CreditUsage.objects.create(
            wallet=credit_wallet,
            amount=cost,
            transaction_type="debit",
            description=f"Debited {cost} credits for Resource Flashcards: '{instance.title}'"
        )
        report_tags.save()


@receiver(post_delete, sender=FlashCards)
def update_flashcards_delete(sender, instance, **kwargs):
    user = instance.module.space.user
    report_tags = ReportTags.objects.filter(user=user).first()
    if report_tags:
        item_count = len(instance.content) if isinstance(instance.content, list) else 1
        report_tags.flashcards = max(0, report_tags.flashcards - item_count)
        report_tags.total_items = max(0, report_tags.total_items - 1)
        report_tags.save()


@receiver(post_save, sender=ModuleFlashcards)
def update_module_flashcards(sender, instance, created, **kwargs):
    if created:
        user = instance.module.space.user
        report_tags, _ = ReportTags.objects.get_or_create(user=user)
        item_count = len(instance.content) if isinstance(instance.content, list) else 1
        report_tags.flashcards += item_count
        
        cost = getattr(instance, 'credit_cost', 10)
        credit_wallet, _ = CreditWallet.objects.get_or_create(user=user, defaults={"balance": 0})
        credit_wallet.debit(cost)
        CreditUsage.objects.create(
            wallet=credit_wallet,
            amount=cost,
            transaction_type="debit",
            description=f"Debited {cost} credits for Module Flashcards: '{instance.title}' ({item_count} cards)"
        )
        report_tags.save()


@receiver(post_delete, sender=ModuleFlashcards)
def update_module_flashcards_delete(sender, instance, **kwargs):
    user = instance.module.space.user
    report_tags = ReportTags.objects.filter(user=user).first()
    if report_tags:
        report_tags.flashcards = max(0, report_tags.flashcards - len(instance.content))
        report_tags.save()


@receiver(post_save, sender=ResourseQuizes)
def update_resourse_quizes(sender, instance, created, **kwargs):
    if created:
        user = instance.resource.module.space.user
        module = instance.resource.module
        report_tags, _ = ReportTags.objects.get_or_create(user=user)
        module_progress, _ = ModuleProgress.objects.get_or_create(module=module)
        
        cost = 10
        credit_wallet, _ = CreditWallet.objects.get_or_create(user=user, defaults={"balance": 0})
        credit_wallet.debit(cost)
        CreditUsage.objects.create(
            wallet=credit_wallet,
            amount=cost,
            transaction_type="debit",
            description=f"Debited {cost} credits for Resource Quiz: '{instance.title}'"
        )
    
        report_tags.quizzes += 1
        report_tags.total_items += 1
        module_progress.total += 1

        report_tags.save()
        module_progress.save()


@receiver(post_delete, sender=ResourseQuizes)
def update_resourse_quizes_delete(sender, instance, **kwargs):
    user = instance.resource.module.space.user
    module = instance.resource.module
    report_tags = ReportTags.objects.filter(user=user).first()
    module_progress = ModuleProgress.objects.filter(module=module).first()

    if report_tags:
        report_tags.quizzes = max(0, report_tags.quizzes - 1)
        report_tags.total_items = max(0, report_tags.total_items - 1)
        if report_tags.quizzes > 0:
            report_tags.average_accuracy = round(max(0, (report_tags.average_accuracy - getattr(instance, 'score', 0)) / report_tags.quizzes), 2)
        else:
            report_tags.average_accuracy = 100
        report_tags.save()

    if module_progress:
        module_progress.total = max(0, module_progress.total - 1)
        module_progress.save()


@receiver(post_save, sender=ModuleQuizes)
def update_module_quizes(sender, instance, created, **kwargs):
    if created:
        user = instance.module.space.user
        module = instance.module

        report_tags, _ = ReportTags.objects.get_or_create(user=user)
        module_progress, _ = ModuleProgress.objects.get_or_create(module=module)
        
        cost = getattr(instance, 'credit_cost', 10)
        credit_wallet, _ = CreditWallet.objects.get_or_create(user=user, defaults={"balance": 0})
        credit_wallet.debit(cost)
        CreditUsage.objects.create(
            wallet=credit_wallet,
            amount=cost,
            transaction_type="debit",
            description=f"Debited {cost} credits for Module Quiz: '{instance.title}'"
        )
        
        report_tags.quizzes += 1
        report_tags.total_items += 1
        module_progress.total += 1

        report_tags.save()
        module_progress.save()


@receiver(post_delete, sender=ModuleQuizes)
def update_module_quizes_delete(sender, instance, **kwargs):
    user = instance.module.space.user
    module = instance.module
    report_tags = ReportTags.objects.filter(user=user).first()
    module_progress = ModuleProgress.objects.filter(module=module).first()

    if report_tags:
        report_tags.quizzes = max(0, report_tags.quizzes - 1)
        report_tags.total_items = max(0, report_tags.total_items - 1)
        if report_tags.quizzes > 0:
            report_tags.average_accuracy = round(max(0, (report_tags.average_accuracy - getattr(instance, 'score', 0)) / report_tags.quizzes), 2)
        else:
            report_tags.average_accuracy = 100
        report_tags.save()

    if module_progress:
        module_progress.total = max(0, module_progress.total - 1)
        module_progress.save()


@receiver(post_save, sender=Notes)
def update_notes(sender, instance, created, **kwargs):
    if created:
        user = instance.resource.module.space.user 
        report_tags, _ = ReportTags.objects.get_or_create(user=user)
        
        cost = 10
        credit_wallet, _ = CreditWallet.objects.get_or_create(user=user, defaults={"balance": 0})
        credit_wallet.debit(cost)
        CreditUsage.objects.create(
            wallet=credit_wallet,
            amount=cost,
            transaction_type="debit",
            description=f"Debited {cost} credits for Notes: '{instance.title}'"
        )
        
        report_tags.notes += 1
        report_tags.total_items += 1
        report_tags.save()


@receiver(post_delete, sender=Notes)
def update_notes_delete(sender, instance, **kwargs):
    user = instance.resource.module.space.user 
    report_tags = ReportTags.objects.filter(user=user).first()
    if report_tags:
        report_tags.notes = max(0, report_tags.notes - 1)
        report_tags.total_items = max(0, report_tags.total_items - 1)
        report_tags.save()


@receiver(post_save, sender=StudySession)
def update_study_session(sender, instance, created, **kwargs):
    if created:
        today = timezone.now().date()
        other_session_exists = StudySession.objects.filter(
            user=instance.user,
            started_at__date=today
        ).exclude(pk=instance.pk).exists()

        if not other_session_exists:
            report_tags, _ = ReportTags.objects.get_or_create(user=instance.user)
            report_tags.streaks += 1
            report_tags.best_streaks = max(report_tags.streaks, report_tags.best_streaks)
            report_tags.save()

    if instance.ended_at is not None:
        report_tags, _ = ReportTags.objects.get_or_create(user=instance.user)
        total_seconds = StudySession.objects.filter(
            user=instance.user,
            ended_at__isnull=False
        ).aggregate(total=Sum('duration'))['total'] or 0
        report_tags.total_hours = round(total_seconds / 3600.0, 2)
        report_tags.save()
