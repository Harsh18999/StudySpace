from accounts.models import CreditWallet

def calculate_resource_credit_cost(instructions: list) -> int:
    """
    10 credits per requested resource instruction (quiz, note, flashcard).
    """
    if not instructions:
        return 10
    return len(instructions) * 10


def calculate_module_credit_cost(resource_count: int, item_count: int) -> int:
    """
    For module quiz/flashcard:
    - Base cost: 10 credits per selected resource (resource_count * 10).
    - Free items threshold: (resource_count * 10) questions/cards.
    - Extra items: 1 credit per question/card beyond threshold.
    Formula: (resource_count * 10) + max(0, item_count - (resource_count * 10))
    """
    resource_count = max(1, resource_count)
    item_count = max(0, item_count)
    base_cost = resource_count * 10
    extra_items = max(0, item_count - base_cost)
    return base_cost + extra_items


def check_user_has_credits(user, required_credits: int) -> tuple[bool, int]:
    """
    Returns (has_credits, current_balance)
    """
    wallet, _ = CreditWallet.objects.get_or_create(user=user, defaults={"balance": 0})
    return wallet.balance >= required_credits, wallet.balance
